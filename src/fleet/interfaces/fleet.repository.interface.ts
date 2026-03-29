import { FuelLog } from '@prisma/client';
import { CreateFuelLogDto } from '../dto/create-fuel-log.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const FLEET_REPOSITORY = 'FLEET_REPOSITORY';

export interface CarWithModelDetails {
  id: string;
  plateNumber: string;
  year: number;
  isFleetVehicle: boolean;
  model: {
    name: string;
    brand: {
      name: string;
    } | null;
  } | null;
}

export interface BasicCarMileage {
  id: string;
  isFleetVehicle: boolean;
  mileageKm: number;
}

export interface VehicleCostAnalyticsRaw {
  item: {
    carId: string;
    _sum: {
      totalCost: number | null;
      liters: number | null;
    };
    _max: {
      odometerKms: number | null;
    };
  };
  car?: {
    id: string;
    plateNumber: string;
    model: {
      name: string;
      brand: {
        name: string;
      } | null;
    } | null;
  };
}

export interface DriverCostAnalyticsRaw {
  item: {
    driverId: string;
    _sum: {
      totalCost: number | null;
      liters: number | null;
    };
    _count: {
      id: number;
    };
  };
  driver?: {
    id: string;
    name: string;
  };
}

/**
 * A single entry in the odometer / fuel history for a vehicle.
 * Returned by getFuelLogHistory ordered by createdAt ASC so callers
 * see the odometer reading progressing monotonically over time.
 */
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
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehicleCostAnalyticsRaw[]>;

  getCostAnalyticsByDriver(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DriverCostAnalyticsRaw[]>;

  /**
   * Paginated, chronological fuel-log history for a single vehicle.
   * Every row includes the odometer reading, fuel data, and the driver's name.
   */
  getFuelLogHistory(
    carId: string,
    pagination: PaginationDto,
  ): Promise<OdometerHistoryEntry[]>;
}
