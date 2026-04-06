import { Injectable } from '@nestjs/common';
import { ICarsRepository } from '../interfaces/cars.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarDto } from '../dto/create-car.dto';
import { UpdateCarDto } from '../dto/update-car.dto';
import { Car } from '@prisma/client';

const CAR_INCLUDE = {
  model: { include: { brand: true } },
} as const;

@Injectable()
export class CarsPrismaRepository implements ICarsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPersonal(userId: string, data: CreateCarDto): Promise<Car> {
    return this.prisma.car.create({
      data: {
        modelId: data.modelId,
        year: data.year,
        mileageKm: data.mileageKm,
        color: data.color,
        plateNumber: data.plateNumber,
        userId,
        organizationId: null,
        isFleetVehicle: false,
        barcode: null,
      },
      include: CAR_INCLUDE,
    });
  }

  async createFleet(organizationId: string, data: CreateCarDto): Promise<Car> {
    return this.prisma.car.create({
      data: {
        modelId: data.modelId,
        year: data.year,
        mileageKm: data.mileageKm,
        color: data.color,
        plateNumber: data.plateNumber,
        organizationId,
        userId: null,
        isFleetVehicle: true,
        barcode: null,
      },
      include: CAR_INCLUDE,
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.car.count({ where: { userId, deletedAt: null } });
  }

  async countByOrganizationId(organizationId: string): Promise<number> {
    return this.prisma.car.count({
      where: { organizationId, deletedAt: null },
    });
  }

  async findAllByUserId(userId: string): Promise<Car[]> {
    return this.prisma.car.findMany({
      where: { userId, deletedAt: null },
      include: CAR_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByOrganizationId(organizationId: string): Promise<Car[]> {
    return this.prisma.car.findMany({
      where: { organizationId, deletedAt: null },
      include: CAR_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Car | null> {
    return this.prisma.car.findFirst({
      where: { id, deletedAt: null },
      include: CAR_INCLUDE,
    });
  }

  async findByIdentifier(identifier: {
    plateNumber?: string;
  }): Promise<Car | null> {
    const orConditions: any[] = [];
    if (identifier.plateNumber) {
      orConditions.push({ plateNumber: identifier.plateNumber });
    }
    if (orConditions.length === 0) return null;

    return this.prisma.car.findFirst({
      where: { OR: orConditions, deletedAt: null },
    });
  }

  async update(id: string, data: UpdateCarDto): Promise<Car> {
    return this.prisma.car.update({
      where: { id },
      data,
      include: CAR_INCLUDE,
    });
  }

  async assignBarcode(carId: string, barcode: string): Promise<Car> {
    return this.prisma.car.update({
      where: { id: carId },
      data: { barcode },
      include: CAR_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
