import { FuelLog } from '@prisma/client';
import { CreateFuelLogDto } from '../dto/create-fuel-log.dto';

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

// 4. Define the aggregated Driver Analytics payload
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

// 5. The fully typed Interface
export interface IFleetRepository {
  findCarByBarcode(barcode: string): Promise<CarWithModelDetails | null>;

  findCarById(carId: string): Promise<BasicCarMileage | null>;

  createFuelLogAndUpdateMileage(
    driverId: string,
    dto: CreateFuelLogDto,
  ): Promise<FuelLog>;

  getCostAnalyticsByVehicle(): Promise<VehicleCostAnalyticsRaw[]>;

  getCostAnalyticsByDriver(): Promise<DriverCostAnalyticsRaw[]>;

  getCostAnalyticsByVehicle(
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehicleCostAnalyticsRaw[]>;

  getCostAnalyticsByDriver(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DriverCostAnalyticsRaw[]>;
}
