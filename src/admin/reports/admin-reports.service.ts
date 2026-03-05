import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { REPORTS_REPOSITORY } from './interfaces/reports.repository.interface';
import type { IReportsRepository } from './interfaces/reports.repository.interface';
import { GetReportDto } from './dto/get-report.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { GetAnalyticsFilterDto } from '../../fleet/dto/get-analytics-filter.dto';

@Injectable()
export class AdminReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: IReportsRepository,
  ) {}

  // 👇 Unified helper that accepts any object with startDate/endDate strings
  private parseDateFilter(filter: { startDate?: string; endDate?: string }) {
    const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
    const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid endDate format');
    }

    if (endDate) {
      endDate.setUTCHours(23, 59, 59, 999);
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate cannot be greater than endDate');
    }

    return { startDate, endDate };
  }

  async getDashboardStats(dto: GetReportDto) {
    const { startDate, endDate } = this.parseDateFilter(dto);

    const metrics = await this.reportsRepository.getDashboardMetrics(
      startDate,
      endDate,
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

  async getFleetDashboard(filter: GetAnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateFilter(filter);
    return this.reportsRepository.getFleetDashboardKpis(startDate, endDate);
  }

  async getVehicleAnalysis(carId: string, filter: GetAnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateFilter(filter);
    return this.reportsRepository.getVehicleTco(carId, startDate, endDate);
  }

  async getDriverAnalysis(driverId: string, filter: GetAnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateFilter(filter);
    return this.reportsRepository.getDriverEfficiency(
      driverId,
      startDate,
      endDate,
    );
  }
}
