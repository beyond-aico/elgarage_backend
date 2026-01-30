import { Expose } from 'class-transformer';

export class DashboardStatsDto {
  @Expose()
  totalUsers!: number;

  @Expose()
  totalCars!: number;

  @Expose()
  totalOrders!: number;

  @Expose()
  totalRevenue!: number;

  @Expose()
  lowStockCount!: number;

  constructor(partial: Partial<DashboardStatsDto>) {
    Object.assign(this, partial);
  }
}
