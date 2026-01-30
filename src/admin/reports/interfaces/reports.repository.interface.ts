import { Part } from '@prisma/client';

export const REPORTS_REPOSITORY = 'REPORTS_REPOSITORY';

export interface DashboardMetrics {
  users: number;
  cars: number;
  orders: number;
  revenue: number;
  lowStockCount: number;
}

export interface IReportsRepository {
  getDashboardMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardMetrics>;
  getLowStockParts(threshold?: number): Promise<Part[]>;
  getTopSellingServices(limit?: number): Promise<any[]>;
}
