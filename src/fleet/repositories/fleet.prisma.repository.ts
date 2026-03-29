import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IFleetRepository,
  CarWithModelDetails,
  BasicCarMileage,
  VehicleCostAnalyticsRaw,
  DriverCostAnalyticsRaw,
  OdometerHistoryEntry,
} from '../interfaces/fleet.repository.interface';
import { CreateFuelLogDto } from '../dto/create-fuel-log.dto';
import { Prisma, FuelLog } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class FleetPrismaRepository implements IFleetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCarByBarcode(barcode: string): Promise<CarWithModelDetails | null> {
    return this.prisma.car.findUnique({
      where: { barcode },
      select: {
        id: true,
        plateNumber: true,
        year: true,
        isFleetVehicle: true,
        model: {
          select: {
            name: true,
            brand: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async findCarById(carId: string): Promise<BasicCarMileage | null> {
    return this.prisma.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        isFleetVehicle: true,
        mileageKm: true,
      },
    });
  }

  async createFuelLogAndUpdateMileage(
    driverId: string,
    dto: CreateFuelLogDto,
  ): Promise<FuelLog> {
    return this.prisma.$transaction(async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: dto.carId },
        select: { mileageKm: true },
      });

      if (!car) {
        throw new BadRequestException('Car not found');
      }

      if (dto.odometerKms < car.mileageKm) {
        throw new BadRequestException(
          'Odometer reading cannot be less than current vehicle mileage',
        );
      }

      const log = await tx.fuelLog.create({
        data: {
          driverId,
          carId: dto.carId,
          odometerKms: dto.odometerKms,
          fuelType: dto.fuelType,
          liters: dto.liters,
          totalCost: dto.totalCost,
          notes: dto.notes,
        },
      });

      await tx.car.update({
        where: { id: dto.carId },
        data: { mileageKm: dto.odometerKms },
      });

      return log;
    });
  }

  async getCostAnalyticsByVehicle(
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehicleCostAnalyticsRaw[]> {
    const whereClause = this.buildDateFilter(startDate, endDate);

    const analysis = await this.prisma.fuelLog.groupBy({
      by: ['carId'],
      _sum: { totalCost: true, liters: true },
      _max: { odometerKms: true },
      where: whereClause,
    });

    if (analysis.length === 0) return [];

    const carIds = [...new Set(analysis.map((a) => a.carId))];
    const cars = await this.prisma.car.findMany({
      where: { id: { in: carIds } },
      select: {
        id: true,
        plateNumber: true,
        model: {
          select: { name: true, brand: { select: { name: true } } },
        },
      },
    });

    const carMap = new Map(cars.map((c) => [c.id, c]));
    return analysis.map((item) => ({ item, car: carMap.get(item.carId) }));
  }

  async getCostAnalyticsByDriver(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DriverCostAnalyticsRaw[]> {
    const whereClause = this.buildDateFilter(startDate, endDate);

    const analysis = await this.prisma.fuelLog.groupBy({
      by: ['driverId'],
      _sum: { totalCost: true, liters: true },
      _count: { id: true },
      where: whereClause, // 👈 Filter applied
    });

    if (analysis.length === 0) return [];

    const driverIds = [...new Set(analysis.map((a) => a.driverId))];
    const drivers = await this.prisma.user.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, name: true },
    });

    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    return analysis.map((item) => ({
      item,
      driver: driverMap.get(item.driverId),
    }));
  }

  /**
   * Paginated odometer / fuel history for a single vehicle, ordered oldest-first
   * so the caller sees odometer readings progressing monotonically over time.
   * Uses the composite index FuelLog(carId, createdAt).
   */
  async getFuelLogHistory(
    carId: string,
    pagination: PaginationDto,
  ): Promise<OdometerHistoryEntry[]> {
    const { skip = 0, take = 20 } = pagination;

    const logs = await this.prisma.fuelLog.findMany({
      where: { carId },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
      select: {
        id: true,
        odometerKms: true,
        fuelType: true,
        liters: true,
        totalCost: true,
        notes: true,
        createdAt: true,
        driver: { select: { name: true } },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      odometerKms: log.odometerKms,
      fuelType: log.fuelType,
      liters: log.liters,
      totalCost: log.totalCost,
      notes: log.notes,
      driverName: log.driver.name,
      createdAt: log.createdAt,
    }));
  }

  private buildDateFilter(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.FuelLogWhereInput {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate cannot be greater than endDate');
    }

    const where: Prisma.FuelLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = startDate;
      }

      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    return where;
  }
}
