import { Part } from '@prisma/client';

export const REPORTS_REPOSITORY = 'REPORTS_REPOSITORY';

export interface DashboardMetrics {
  users: number;
  cars: number;
  orders: number;
  revenue: number;
  lowStockCount: number;
}

export interface FleetDashboardKpis {
  totalFleetCost: number;
  totalFuelConsumedLiters: number;
  totalKmsDriven: number;
  costPerKm: number;
}

export interface VehicleTcoAnalytics {
  carId: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCostOfOwnership: number;
  totalLiters: number;
}

export interface DriverEfficiencyAnalytics {
  driverId: string;
  totalFuelCost: number;
  totalLiters: number;
  totalKmsDriven: number;
  litersPer100Km: number;
  efficiencyStatus: 'EXCELLENT' | 'NORMAL' | 'POOR' | 'UNKNOWN';
}

export interface IReportsRepository {
  getDashboardMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardMetrics>;
  getLowStockParts(): Promise<Part[]>;
  getTopSellingServices(limit?: number): Promise<any[]>;
  getFleetDashboardKpis(
    startDate?: Date,
    endDate?: Date,
  ): Promise<FleetDashboardKpis>;
  getVehicleTco(
    carId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehicleTcoAnalytics>;
  getDriverEfficiency(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DriverEfficiencyAnalytics>;
}
