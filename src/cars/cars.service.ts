import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async create(userContext: AuthUser, dto: CreateCarDto) {
    if (userContext.organizationId) {
      return this.createFleetCar(userContext.organizationId, dto);
    }
    return this.createPersonalCar(userContext.userId, dto);
  }

  private async createFleetCar(orgId: string, dto: CreateCarDto) {
    const currentCount = await this.prisma.car.count({
      where: { organizationId: orgId, deletedAt: null },
    });

    if (currentCount >= 50) {
      throw new ForbiddenException(
        'Fleet limit reached (50). Contact sales to upgrade.',
      );
    }

    return this.prisma.car.create({
      data: {
        modelId: dto.modelId,
        year: dto.year,
        mileageKm: dto.mileageKm,
        color: dto.color,
        plateNumber: dto.plateNumber,
        organizationId: orgId,
        userId: null,
        isFleetVehicle: true, // set programmatically — not from DTO
        barcode: null, // barcode generated separately when needed
      },
    });
  }

  private async createPersonalCar(userId: string, dto: CreateCarDto) {
    const currentCount = await this.prisma.car.count({
      where: { userId, deletedAt: null },
    });

    if (currentCount >= 2) {
      throw new ForbiddenException(
        'Free accounts are limited to 2 vehicles. Please upgrade.',
      );
    }

    return this.prisma.car.create({
      data: {
        modelId: dto.modelId,
        year: dto.year,
        mileageKm: dto.mileageKm,
        color: dto.color,
        plateNumber: dto.plateNumber,
        userId: userId,
        organizationId: null,
        isFleetVehicle: false, // personal cars are never fleet vehicles
        barcode: null,
      },
    });
  }

  async findAll(userContext: AuthUser) {
    if (userContext.organizationId) {
      return this.prisma.car.findMany({
        where: { organizationId: userContext.organizationId, deletedAt: null },
        include: { model: { include: { brand: true } } },
      });
    }

    return this.prisma.car.findMany({
      where: { userId: userContext.userId, deletedAt: null },
      include: { model: { include: { brand: true } } },
    });
  }

  async findOne(id: string, userContext: AuthUser) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { model: true },
    });

    if (!car || car.deletedAt !== null) {
      throw new NotFoundException('Car not found');
    }

    const isMyPersonal = car.userId === userContext.userId;
    // Guard: organizationId must be non-null on BOTH sides to match
    const isMyFleet =
      userContext.organizationId != null &&
      car.organizationId === userContext.organizationId;

    if (!isMyPersonal && !isMyFleet && userContext.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this vehicle');
    }

    return car;
  }

  async update(id: string, dto: UpdateCarDto, userContext: AuthUser) {
    await this.findOne(id, userContext);
    return this.prisma.car.update({ where: { id }, data: dto });
  }

  async remove(id: string, userContext: AuthUser) {
    await this.findOne(id, userContext);
    return this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
