import { Injectable } from '@nestjs/common';
import { DashboardMetrics } from '../interfaces/reports.repository.interface';
import type { IReportsRepository } from '../interfaces/reports.repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { Part, OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsPrismaRepository implements IReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardMetrics> {
    // Basic date filtering for orders if needed
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const [users, cars, orders, revenueAgg, lowStock] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.car.count(),
      this.prisma.order.count({ where: dateFilter }),
      this.prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: {
          ...dateFilter,
          status: { not: OrderStatus.CANCELLED }, // Don't count cancelled orders
        },
      }),
      this.prisma.part.count({
        where: {
          quantity: { lte: 5 }, // You can make this dynamic if needed
        },
      }),
    ]);

    return {
      users,
      cars,
      orders,
      revenue: revenueAgg._sum.totalPrice
        ? Number(revenueAgg._sum.totalPrice)
        : 0,
      lowStockCount: lowStock,
    };
  }

  async getLowStockParts(threshold: number = 5): Promise<Part[]> {
    return this.prisma.part.findMany({
      where: {
        quantity: { lte: threshold },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async getTopSellingServices(limit: number = 5): Promise<any[]> {
    // Complex grouping: Count how many times each serviceId appears in OrderItems
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

    // We need to fetch the actual Service names because groupBy only gives IDs
    // In a pure SQL view this is easier, but here we do a second lookup
    const serviceIds = result.map((r) => r.serviceId as string);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    return result.map((r) => {
      const service = services.find((s) => s.id === r.serviceId);
      return {
        serviceName: service?.name || 'Unknown',
        count: r._count.serviceId,
      };
    });
  }
}
