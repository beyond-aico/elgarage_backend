import { FuelLog } from '@prisma/client';
import { CreateFuelLogDto } from '../dto/create-fuel-log.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const FLEET_REPOSITORY = 'FLEET_REPOSITORY';

export interface CarWithModelDetails {
  id: string;
  plateNumber: string;
  year: number;
  isFleetVehicle: boolean;
  organizationId: string | null; // needed for org-scope validation
  model: {
    name: string;
    brand: { name: string } | null;
  } | null;
}

export interface BasicCarMileage {
  id: string;
  isFleetVehicle: boolean;
  mileageKm: number;
  organizationId: string | null; // needed for org-scope validation
}

export interface VehicleCostAnalyticsRaw {
  item: {
    carId: string;
    _sum: { totalCost: number | null; liters: number | null };
    _max: { odometerKms: number | null };
  };
  car?: {
    id: string;
    plateNumber: string;
    model: { name: string; brand: { name: string } | null } | null;
  };
}

export interface DriverCostAnalyticsRaw {
  item: {
    driverId: string;
    _sum: { totalCost: number | null; liters: number | null };
    _count: { id: number };
  };
  driver?: { id: string; name: string };
}

export interface OdometerHistoryEntry {
  id: string;
  odometerKms: number;
  fuelType: string;
  liters: number;
  totalCost: number;
  notes: string | null;
  driverName: string | null;
  createdAt: Date;
}

export interface IFleetRepository {
  findCarByBarcode(barcode: string): Promise<CarWithModelDetails | null>;
  findCarById(carId: string): Promise<BasicCarMileage | null>;
  createFuelLogAndUpdateMileage(
    driverId: string,
    dto: CreateFuelLogDto,
  ): Promise<FuelLog>;
  getCostAnalyticsByVehicle(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehicleCostAnalyticsRaw[]>;
  getCostAnalyticsByDriver(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DriverCostAnalyticsRaw[]>;
  getFuelLogHistory(
    carId: string,
    pagination: PaginationDto,
  ): Promise<OdometerHistoryEntry[]>;
}
