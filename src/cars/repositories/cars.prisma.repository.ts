import { Injectable } from '@nestjs/common';
import { ICarsRepository } from '../interfaces/cars.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarDto } from '../dto/create-car.dto';
import { UpdateCarDto } from '../dto/update-car.dto';
import { Car } from '@prisma/client';

@Injectable()
export class CarsPrismaRepository implements ICarsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateCarDto): Promise<Car> {
    return this.prisma.car.create({
      data: {
        userId,
        ...data,
      },
      include: { model: { include: { brand: true } } },
    });
  }

  async findAllByUserId(userId: string): Promise<Car[]> {
    return this.prisma.car.findMany({
      where: { userId, deletedAt: null },
      include: {
        model: {
          include: { brand: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Car | null> {
    return this.prisma.car.findFirst({
      where: { id, deletedAt: null },
      include: { model: { include: { brand: true } } },
    });
  }

  async findByIdentifier(identifier: {
    plateNumber?: string;
  }): Promise<Car | null> {
    const orConditions: any[] = [];

    if (identifier.plateNumber) {
      orConditions.push({ plateNumber: identifier.plateNumber });
    }

    if (orConditions.length === 0) {
      return null;
    }

    return this.prisma.car.findFirst({
      where: {
        OR: orConditions,
        deletedAt: null,
      },
    });
  }

  async update(id: string, data: UpdateCarDto): Promise<Car> {
    return this.prisma.car.update({
      where: { id },
      data,
      include: { model: { include: { brand: true } } },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
