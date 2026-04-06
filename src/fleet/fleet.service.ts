import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @Inject(FLEET_REPOSITORY)
    private readonly fleetRepo: IFleetRepository,
  ) {}

  async authenticateVehicle(dto: AuthBarcodeDto, userContext: AuthUser) {
    const car = await this.fleetRepo.findCarByBarcode(dto.barcode);

    if (!car || !car.isFleetVehicle) {
      throw new NotFoundException('Invalid fleet vehicle barcode');
    }

    // Ensure the vehicle belongs to the driver's organization
    this.assertOrgAccess(car.organizationId, userContext.organizationId);

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
    userContext: AuthUser,
    dto: CreateFuelLogDto,
  ): Promise<{ message: string; data: FuelLog }> {
    const car = await this.fleetRepo.findCarById(dto.carId);

    if (!car) throw new NotFoundException('Car not found');

    if (!car.isFleetVehicle) {
      throw new BadRequestException(
        'Fuel logs are allowed only for fleet vehicles',
      );
    }

    // Driver must belong to the same org as the vehicle
    this.assertOrgAccess(car.organizationId, userContext.organizationId);

    if (dto.odometerKms < car.mileageKm) {
      throw new BadRequestException(
        'Odometer reading cannot be less than current vehicle mileage',
      );
    }

    try {
      const log = await this.fleetRepo.createFuelLogAndUpdateMileage(
        userContext.userId,
        dto,
      );
      return { message: 'Fuel log recorded successfully', data: log };
    } catch (error) {
      this.logger.error(
        'Fuel log creation failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to record fuel log');
    }
  }

  async getOdometerHistory(
    carId: string,
    userContext: AuthUser,
    pagination: PaginationDto,
  ) {
    // Verify the car belongs to the manager's org
    const car = await this.fleetRepo.findCarById(carId);
    if (!car) throw new NotFoundException('Car not found');
    this.assertOrgAccess(car.organizationId, userContext.organizationId);

    return this.fleetRepo.getFuelLogHistory(carId, pagination);
  }

  async getDriverFuelLogs(driverId: string, pagination: PaginationDto) {
    return this.fleetRepo.getDriverFuelLogs(driverId, pagination);
  }

  async getCostByVehicle(userContext: AuthUser, filter: GetAnalyticsFilterDto) {
    const orgId = this.requireOrgId(userContext);
    const { startDate, endDate } = this.parseDateRange(filter);

    const rawData = await this.fleetRepo.getCostAnalyticsByVehicle(
      orgId,
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

  async getCostByDriver(userContext: AuthUser, filter: GetAnalyticsFilterDto) {
    const orgId = this.requireOrgId(userContext);
    const { startDate, endDate } = this.parseDateRange(filter);

    const rawData = await this.fleetRepo.getCostAnalyticsByDriver(
      orgId,
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

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private requireOrgId(userContext: AuthUser): string {
    if (!userContext.organizationId) {
      throw new ForbiddenException(
        'This endpoint requires an organizational account',
      );
    }
    return userContext.organizationId;
  }

  private assertOrgAccess(
    carOrgId: string | null,
    userOrgId: string | null | undefined,
  ): void {
    if (!userOrgId || carOrgId !== userOrgId) {
      throw new ForbiddenException(
        'This vehicle does not belong to your organization',
      );
    }
  }

  private parseDateRange(filter: GetAnalyticsFilterDto): {
    startDate?: Date;
    endDate?: Date;
  } {
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
}
