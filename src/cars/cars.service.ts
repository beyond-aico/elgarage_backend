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

  // 1. CREATE with "Dual Ownership" Logic
  async create(userContext: AuthUser, dto: CreateCarDto) {
    // A. Corporate Logic (B2B)
    if (userContext.organizationId) {
      return this.createFleetCar(userContext.organizationId, dto);
    }

    // B. Personal Logic (B2C)
    return this.createPersonalCar(userContext.userId, dto);
  }

  // --- Internal Helper: B2B Logic ---
  private async createFleetCar(orgId: string, dto: CreateCarDto) {
    // Exclude soft-deleted cars from the fleet count
    const currentCount = await this.prisma.car.count({
      where: { organizationId: orgId, deletedAt: null },
    });

    const FLEET_LIMIT = 50;
    if (currentCount >= FLEET_LIMIT) {
      throw new ForbiddenException(
        `Fleet limit reached (${FLEET_LIMIT}). Contact sales to upgrade.`,
      );
    }

    return this.prisma.car.create({
      data: {
        ...dto,
        organizationId: orgId, // Owned by Company
        userId: null, // No single personal owner
      },
    });
  }

  // --- Internal Helper: B2C Logic ---
  private async createPersonalCar(userId: string, dto: CreateCarDto) {
    // Exclude soft-deleted cars from the ownership count
    const currentCount = await this.prisma.car.count({
      where: { userId, deletedAt: null },
    });

    const PERSONAL_LIMIT = 2;
    if (currentCount >= PERSONAL_LIMIT) {
      throw new ForbiddenException(
        `Free accounts are limited to ${PERSONAL_LIMIT} vehicles. Please upgrade.`,
      );
    }

    return this.prisma.car.create({
      data: {
        ...dto,
        userId: userId, // Owned by User
        organizationId: null,
      },
    });
  }

  // 2. FIND ALL (Context Aware) — exclude soft-deleted
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

  // 3. FIND ONE (Security Check) — treat soft-deleted as not found
  async findOne(id: string, userContext: AuthUser) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { model: true },
    });

    if (!car || car.deletedAt !== null) {
      throw new NotFoundException('Car not found');
    }

    // Security: Is this MY car? Or MY COMPANY'S car?
    const isMyPersonal = car.userId === userContext.userId;
    const isMyFleet = car.organizationId === userContext.organizationId;

    if (!isMyPersonal && !isMyFleet && userContext.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this vehicle');
    }

    return car;
  }

  // 4. UPDATE
  async update(id: string, dto: UpdateCarDto, userContext: AuthUser) {
    await this.findOne(id, userContext);

    return this.prisma.car.update({
      where: { id },
      data: dto,
    });
  }

  // 5. REMOVE — soft-delete, never physically removes the row
  async remove(id: string, userContext: AuthUser) {
    await this.findOne(id, userContext); // security + existence check

    return this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
