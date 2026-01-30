import { Inject, Injectable } from '@nestjs/common';
import { REPORTS_REPOSITORY } from './interfaces/reports.repository.interface';
import type { IReportsRepository } from './interfaces/reports.repository.interface';
import { GetReportDto } from './dto/get-report.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: IReportsRepository,
  ) {}

  async getDashboardStats(dto: GetReportDto) {
    const start = dto.startDate ? new Date(dto.startDate) : undefined;
    const end = dto.endDate ? new Date(dto.endDate) : undefined;

    const metrics = await this.reportsRepository.getDashboardMetrics(
      start,
      end,
    );

    return new DashboardStatsDto({
      totalUsers: metrics.users,
      totalCars: metrics.cars,
      totalOrders: metrics.orders,
      totalRevenue: metrics.revenue,
      lowStockCount: metrics.lowStockCount,
    });
  }

  async getInventoryReport() {
    return this.reportsRepository.getLowStockParts();
  }

  async getPopularServices() {
    return this.reportsRepository.getTopSellingServices();
  }
}
