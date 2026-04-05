import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { REPORTS_REPOSITORY } from './interfaces/reports.repository.interface';
import type { IReportsRepository } from './interfaces/reports.repository.interface';
import { GetReportDto } from './dto/get-report.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { GetAnalyticsFilterDto } from '../../fleet/dto/get-analytics-filter.dto';
import { AuthUser } from '../../auth/types/auth-user.type';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: IReportsRepository,
  ) {}

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

  /**
   * pass organizationId for Account Manager callers.
   * ADMIN receives undefined → sees all orgs.
   */
  async getFleetDashboard(
    filter: GetAnalyticsFilterDto,
    userContext: AuthUser,
  ) {
    const { startDate, endDate } = this.parseDateFilter(filter);
    const organizationId =
      userContext.role === UserRole.ACCOUNT_MANAGER
        ? (userContext.organizationId ?? undefined)
        : undefined;

    return this.reportsRepository.getFleetDashboardKpis(
      startDate,
      endDate,
      organizationId,
    );
  }

  /**
   * pass organizationId so the repository can validate ownership.
   */
  async getVehicleAnalysis(
    carId: string,
    filter: GetAnalyticsFilterDto,
    userContext: AuthUser,
  ) {
    const { startDate, endDate } = this.parseDateFilter(filter);
    const organizationId =
      userContext.role === UserRole.ACCOUNT_MANAGER
        ? (userContext.organizationId ?? undefined)
        : undefined;

    return this.reportsRepository.getVehicleTco(
      carId,
      startDate,
      endDate,
      organizationId,
    );
  }

  async getDriverAnalysis(
    driverId: string,
    filter: GetAnalyticsFilterDto,
    userContext: AuthUser,
  ) {
    const { startDate, endDate } = this.parseDateFilter(filter);
    const organizationId =
      userContext.role === UserRole.ACCOUNT_MANAGER
        ? (userContext.organizationId ?? undefined)
        : undefined;

    return this.reportsRepository.getDriverEfficiency(
      driverId,
      startDate,
      endDate,
      organizationId,
    );
  }
}
