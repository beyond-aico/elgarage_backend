import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { FuelLog } from '@prisma/client';

import { AuthBarcodeDto } from './dto/auth-barcode.dto';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import {
  IFleetRepository,
  FLEET_REPOSITORY,
} from './interfaces/fleet.repository.interface';
import { GetAnalyticsFilterDto } from './dto/get-analytics-filter.dto';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @Inject(FLEET_REPOSITORY)
    private readonly fleetRepo: IFleetRepository,
  ) {}

  async authenticateVehicle(dto: AuthBarcodeDto) {
    const car = await this.fleetRepo.findCarByBarcode(dto.barcode);

    if (!car || !car.isFleetVehicle) {
      throw new NotFoundException('Invalid fleet vehicle barcode');
    }

    return {
      message: 'Vehicle authenticated successfully',
      data: {
        id: car.id,
        plateNumber: car.plateNumber,
        brand: car.model?.brand?.name ?? null,
        model: car.model?.name ?? null,
        year: car.year,
      },
    };
  }

  async addFuelLog(
    driverId: string,
    dto: CreateFuelLogDto,
  ): Promise<{ message: string; data: FuelLog }> {
    const car = await this.fleetRepo.findCarById(dto.carId);

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    if (!car.isFleetVehicle) {
      throw new BadRequestException(
        'Fuel logs are allowed only for fleet vehicles',
      );
    }

    if (dto.odometerKms < car.mileageKm) {
      throw new BadRequestException(
        'Odometer reading cannot be less than current vehicle mileage',
      );
    }

    try {
      const log = await this.fleetRepo.createFuelLogAndUpdateMileage(
        driverId,
        dto,
      );

      return {
        message: 'Fuel log recorded successfully',
        data: log,
      };
    } catch (error) {
      this.logger.error(
        'Fuel log creation failed',
        error instanceof Error ? error.stack : undefined,
      );

      throw new BadRequestException('Failed to record fuel log');
    }
  }

  private parseDateRange(filter: GetAnalyticsFilterDto): { startDate?: Date; endDate?: Date } {
    const startDate = filter.startDate ? new Date(filter.startDate) : undefined;

    let endDate: Date | undefined;
    if (filter.endDate) {
      endDate = new Date(filter.endDate);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate cannot be greater than endDate');
    }

    return { startDate, endDate };
  }

  async getCostByVehicle(filter: GetAnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateRange(filter);

    const rawData = await this.fleetRepo.getCostAnalyticsByVehicle(
      startDate,
      endDate,
    );

    if (!rawData.length) return [];

    return rawData.map(({ item, car }) => ({
      carId: item.carId,
      plateNumber: car?.plateNumber ?? null,
      brand: car?.model?.brand?.name ?? null,
      model: car?.model?.name ?? null,
      totalFuelCost: item._sum.totalCost ?? 0,
      totalLiters: item._sum.liters ?? 0,
      lastOdometer: item._max.odometerKms ?? 0,
    }));
  }

  async getCostByDriver(filter: GetAnalyticsFilterDto) {
    const { startDate, endDate } = this.parseDateRange(filter);

    const rawData = await this.fleetRepo.getCostAnalyticsByDriver(
      startDate,
      endDate,
    );

    if (!rawData.length) return [];

    return rawData.map(({ item, driver }) => ({
      driverId: item.driverId,
      driverName: driver?.name ?? null,
      totalFuelCost: item._sum.totalCost ?? 0,
      totalLiters: item._sum.liters ?? 0,
      fuelLogsCount: item._count.id,
    }));
  }
}
