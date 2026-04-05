import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  DashboardMetrics,
  FleetDashboardKpis,
  VehicleTcoAnalytics,
  DriverEfficiencyAnalytics,
} from '../interfaces/reports.repository.interface';
import type { IReportsRepository } from '../interfaces/reports.repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { Part, OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReportsPrismaRepository implements IReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ─────────────────────────────────────────────────────────

  private buildFuelLogDateFilter(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.FuelLogWhereInput {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate cannot be greater than endDate');
    }
    const where: Prisma.FuelLogWhereInput = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
      if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
    }
    return where;
  }

  private async getOrgCarIds(organizationId: string): Promise<string[]> {
    const cars = await this.prisma.car.findMany({
      where: {
        organizationId,
        deletedAt: null, // explicit — never aggregate soft-deleted vehicles
      },
      select: { id: true },
    });
    return cars.map((c) => c.id);
  }

  // Dashboard

  async getDashboardMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardMetrics> {
    const dateFilter: Prisma.OrderWhereInput = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate)
        (dateFilter.createdAt as Prisma.DateTimeFilter).gte = startDate;
      if (endDate)
        (dateFilter.createdAt as Prisma.DateTimeFilter).lte = endDate;
    }

    const [users, cars, orders, revenueAgg, lowStockResult] = await Promise.all(
      [
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.car.count({ where: { deletedAt: null } }),
        this.prisma.order.count({ where: dateFilter }),
        this.prisma.order.aggregate({
          _sum: { totalPrice: true },
          where: {
            ...dateFilter,
            status: { not: OrderStatus.CANCELLED },
          },
        }),
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::int AS count FROM "Part"
          WHERE "lowStockThreshold" IS NOT NULL
            AND quantity <= "lowStockThreshold"
            AND "deletedAt" IS NULL
        `,
      ],
    );

    return {
      users,
      cars,
      orders,
      revenue: revenueAgg._sum.totalPrice
        ? Number(revenueAgg._sum.totalPrice)
        : 0,
      lowStockCount: Number(lowStockResult[0]?.count ?? 0),
    };
  }

  async getLowStockParts(): Promise<Part[]> {
    return this.prisma.$queryRaw<Part[]>`
      SELECT * FROM "Part"
      WHERE "lowStockThreshold" IS NOT NULL
        AND quantity <= "lowStockThreshold"
        AND "deletedAt" IS NULL
      ORDER BY quantity ASC
    `;
  }

  async getTopSellingServices(limit: number = 5): Promise<any[]> {
    const result = await this.prisma.orderItem.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      where: {
        serviceId: { not: null },
        order: { status: { not: OrderStatus.CANCELLED } },
      },
      orderBy: { _count: { serviceId: 'desc' } },
      take: limit,
    });

    const serviceIds = result.map((r) => r.serviceId as string);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    return result.map((r) => {
      const service = services.find((s) => s.id === r.serviceId);
      return {
        serviceName: service?.name ?? 'Unknown',
        count: r._count.serviceId,
      };
    });
  }

  // Fleet Dashboard

  async getFleetDashboardKpis(
    startDate?: Date,
    endDate?: Date,
    organizationId?: string,
  ): Promise<FleetDashboardKpis> {
    let where = this.buildFuelLogDateFilter(startDate, endDate);

    if (organizationId) {
      const orgCarIds = await this.getOrgCarIds(organizationId);
      if (orgCarIds.length === 0) {
        return {
          totalFleetCost: 0,
          totalFuelConsumedLiters: 0,
          totalKmsDriven: 0,
          costPerKm: 0,
        };
      }

      where = { ...where, carId: { in: orgCarIds } };
    }

    const [totals, vehicleStats] = await Promise.all([
      this.prisma.fuelLog.aggregate({
        _sum: { totalCost: true, liters: true },
        where,
      }),
      this.prisma.fuelLog.groupBy({
        by: ['carId'],
        _min: { odometerKms: true },
        _max: { odometerKms: true },
        where,
      }),
    ]);

    const totalKmsDriven = vehicleStats.reduce((acc, curr) => {
      const min = curr._min.odometerKms ?? 0;
      const max = curr._max.odometerKms ?? 0;
      return acc + (max - min);
    }, 0);

    const totalFleetCost = Number(totals._sum.totalCost ?? 0);
    const totalFuelConsumedLiters = Number(totals._sum.liters ?? 0);
    const costPerKm = totalKmsDriven > 0 ? totalFleetCost / totalKmsDriven : 0;

    return {
      totalFleetCost,
      totalFuelConsumedLiters,
      totalKmsDriven,
      costPerKm: Number(costPerKm.toFixed(2)),
    };
  }

  // Vehicle Total Cost of Ownership

  async getVehicleTco(
    carId: string,
    startDate?: Date,
    endDate?: Date,
    organizationId?: string,
  ): Promise<VehicleTcoAnalytics> {
    if (organizationId) {
      const car = await this.prisma.car.findFirst({
        where: { id: carId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!car) {
        throw new ForbiddenException(
          'This vehicle does not belong to your organization',
        );
      }
    }

    const where = this.buildFuelLogDateFilter(startDate, endDate);

    const maintenanceWhere: Prisma.OrderWhereInput = {
      carId,
      status: { not: OrderStatus.CANCELLED },
    };
    if (startDate || endDate) {
      maintenanceWhere.createdAt = {};
      if (startDate)
        (maintenanceWhere.createdAt as Prisma.DateTimeFilter).gte = startDate;
      if (endDate)
        (maintenanceWhere.createdAt as Prisma.DateTimeFilter).lte = endDate;
    }

    const [fuel, maintenance] = await Promise.all([
      this.prisma.fuelLog.aggregate({
        _sum: { totalCost: true, liters: true },
        where: { carId, ...where },
      }),
      this.prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: maintenanceWhere,
      }),
    ]);

    const fuelCost = Number(fuel._sum.totalCost ?? 0);
    const totalLiters = Number(fuel._sum.liters ?? 0);
    const maintenanceCost = Number(maintenance._sum.totalPrice ?? 0);

    return {
      carId,
      fuelCost,
      maintenanceCost,
      totalCostOfOwnership: fuelCost + maintenanceCost,
      totalLiters,
    };
  }

  // Driver Efficiency Analytics

  async getDriverEfficiency(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
    organizationId?: string,
  ): Promise<DriverEfficiencyAnalytics> {
    // Validate driver belongs to org (existing check)
    if (organizationId) {
      const driver = await this.prisma.user.findFirst({
        where: { id: driverId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!driver) {
        throw new ForbiddenException(
          'This driver does not belong to your organization',
        );
      }
    }

    const dateFilter = this.buildFuelLogDateFilter(startDate, endDate);

    let where: Prisma.FuelLogWhereInput = { driverId, ...dateFilter };

    if (organizationId) {
      const orgCarIds = await this.getOrgCarIds(organizationId);
      if (orgCarIds.length === 0) {
        return {
          driverId,
          totalFuelCost: 0,
          totalLiters: 0,
          totalKmsDriven: 0,
          litersPer100Km: 0,
          efficiencyStatus: 'UNKNOWN',
        };
      }
      // Constrain to fuel logs where the car also belongs to this org
      where = { ...where, carId: { in: orgCarIds } };
    }

    const [fuel, carStats] = await Promise.all([
      this.prisma.fuelLog.aggregate({
        _sum: { totalCost: true, liters: true },
        where,
      }),
      this.prisma.fuelLog.groupBy({
        by: ['carId'],
        _min: { odometerKms: true },
        _max: { odometerKms: true },
        where,
      }),
    ]);

    const totalKmsDriven = carStats.reduce((acc, curr) => {
      const min = curr._min.odometerKms ?? 0;
      const max = curr._max.odometerKms ?? 0;
      return acc + (max - min);
    }, 0);

    const totalLiters = Number(fuel._sum.liters ?? 0);
    const totalFuelCost = Number(fuel._sum.totalCost ?? 0);

    const litersPer100Km =
      totalKmsDriven > 0 ? (totalLiters / totalKmsDriven) * 100 : 0;

    let efficiencyStatus: DriverEfficiencyAnalytics['efficiencyStatus'] =
      'UNKNOWN';
    if (totalKmsDriven > 0) {
      if (litersPer100Km < 8) efficiencyStatus = 'EXCELLENT';
      else if (litersPer100Km <= 12) efficiencyStatus = 'NORMAL';
      else efficiencyStatus = 'POOR';
    }

    return {
      driverId,
      totalFuelCost,
      totalLiters,
      totalKmsDriven,
      litersPer100Km: Number(litersPer100Km.toFixed(2)),
      efficiencyStatus,
    };
  }
}
