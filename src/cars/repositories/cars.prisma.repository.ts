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
      where: { userId },
      include: {
        model: {
          include: { brand: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Car | null> {
    return this.prisma.car.findUnique({
      where: { id },
      include: { model: { include: { brand: true } } },
    });
  }

  async findByIdentifier(identifier: {
    plateNumber?: string;
    vin?: string;
  }): Promise<Car | null> {
    const orConditions: any[] = [];

    if (identifier.plateNumber) {
      orConditions.push({ plateNumber: identifier.plateNumber });
    }

    if (identifier.vin) {
      orConditions.push({ vin: identifier.vin });
    }

    if (orConditions.length === 0) {
      return null;
    }

    return this.prisma.car.findFirst({
      where: {
        OR: orConditions,
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

  async delete(id: string): Promise<void> {
    await this.prisma.car.delete({ where: { id } });
  }
}
