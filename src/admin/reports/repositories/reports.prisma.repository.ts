import { Injectable, BadRequestException } from '@nestjs/common';
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

  private buildDateFilter(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.FuelLogWhereInput {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate cannot be greater than endDate');
    }

    const where: Prisma.FuelLogWhereInput = {};

    if (startDate || endDate) {
      const createdAt: Prisma.DateTimeFilter = {};

      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;

      where.createdAt = createdAt;
    }

    return where;
  }

  async getDashboardMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardMetrics> {
    // Supports one-sided ranges: startDate-only and endDate-only both work.
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
        // Exclude soft-deleted users from the dashboard count
        this.prisma.user.count({ where: { deletedAt: null } }),
        // Exclude soft-deleted cars from the dashboard count
        this.prisma.car.count({ where: { deletedAt: null } }),
        this.prisma.order.count({ where: dateFilter }),
        this.prisma.order.aggregate({
          _sum: { totalPrice: true },
          where: {
            ...dateFilter,
            status: { not: OrderStatus.CANCELLED },
          },
        }),
        // Exclude soft-deleted parts from the low-stock count
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
    // Compare each part's quantity against its own configured threshold.
    // The IS NOT NULL guard makes the null-exclusion behaviour explicit —
    // parts without a configured threshold are intentionally skipped.
    // "deletedAt" IS NULL excludes soft-deleted parts.
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
      _count: {
        serviceId: true,
      },
      where: {
        serviceId: { not: null },
      },
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
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

  async getFleetDashboardKpis(
    startDate?: Date,
    endDate?: Date,
  ): Promise<FleetDashboardKpis> {
    const where = this.buildDateFilter(startDate, endDate);

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

    const totalFleetCost = totals._sum.totalCost ?? 0;

    const costPerKm = totalKmsDriven > 0 ? totalFleetCost / totalKmsDriven : 0;

    return {
      totalFleetCost,
      totalFuelConsumedLiters: totals._sum.liters ?? 0,
      totalKmsDriven,
      costPerKm: Number(costPerKm.toFixed(2)),
    };
  }

  // Vehicle Total Cost of Ownership
  async getVehicleTco(
    carId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehicleTcoAnalytics> {
    const where = this.buildDateFilter(startDate, endDate);

    const maintenanceWhere: Prisma.OrderWhereInput = { carId };

    if (startDate || endDate) {
      maintenanceWhere.createdAt = {};
      if (startDate) maintenanceWhere.createdAt.gte = startDate;
      if (endDate) maintenanceWhere.createdAt.lte = endDate;
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

    const fuelCost = fuel._sum.totalCost ?? 0;
    const maintenanceCost = Number(maintenance._sum.totalPrice ?? 0);

    return {
      carId,
      fuelCost,
      maintenanceCost,
      totalCostOfOwnership: fuelCost + maintenanceCost,
      totalLiters: fuel._sum.liters ?? 0,
    };
  }

  // Driver Efficiency Analytics
  async getDriverEfficiency(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DriverEfficiencyAnalytics> {
    const where = this.buildDateFilter(startDate, endDate);

    const [fuel, carStats] = await Promise.all([
      this.prisma.fuelLog.aggregate({
        _sum: { totalCost: true, liters: true },
        where: { driverId, ...where },
      }),
      this.prisma.fuelLog.groupBy({
        by: ['carId'],
        _min: { odometerKms: true },
        _max: { odometerKms: true },
        where: { driverId, ...where },
      }),
    ]);

    const totalKmsDriven = carStats.reduce((acc, curr) => {
      const min = curr._min.odometerKms ?? 0;
      const max = curr._max.odometerKms ?? 0;
      return acc + (max - min);
    }, 0);

    const totalLiters = fuel._sum.liters ?? 0;

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
      totalFuelCost: fuel._sum.totalCost ?? 0,
      totalLiters,
      totalKmsDriven,
      litersPer100Km: Number(litersPer100Km.toFixed(2)),
      efficiencyStatus,
    };
  }
}
