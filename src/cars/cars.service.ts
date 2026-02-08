import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto'; // Ensure you have this file (partial of CreateCarDto)
import { UserRole } from '@prisma/client';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE with "Dual Ownership" Logic
  async create(userContext: any, dto: CreateCarDto) {
    // A. Corporate Logic (B2B)
    if (userContext.organizationId) {
      return this.createFleetCar(userContext.organizationId, dto);
    }
    
    // B. Personal Logic (B2C)
    return this.createPersonalCar(userContext.userId, dto);
  }

  // --- Internal Helper: B2B Logic ---
  private async createFleetCar(orgId: string, dto: CreateCarDto) {
    // Check Fleet Limits (Example: 50 cars max)
    // In a real app, fetch 'maxFleetSize' from the Organization table
    const currentCount = await this.prisma.car.count({
      where: { organizationId: orgId },
    });

    const FLEET_LIMIT = 50; // Hardcoded for now, or fetch from Org
    if (currentCount >= FLEET_LIMIT) {
      throw new ForbiddenException(
        `Fleet limit reached (${FLEET_LIMIT}). Contact sales to upgrade.`,
      );
    }

    return this.prisma.car.create({
      data: {
        ...dto,
        organizationId: orgId, // Owned by Company
        userId: null,          // No single personal owner
      },
    });
  }

  // --- Internal Helper: B2C Logic ---
  private async createPersonalCar(userId: string, dto: CreateCarDto) {
    // Check Personal Limits (Strict 2 cars)
    const currentCount = await this.prisma.car.count({
      where: { userId },
    });

    if (currentCount >= 10) {
      throw new ForbiddenException(
        'Free accounts are limited to 2 vehicles. Please upgrade.',
      );
    }

    return this.prisma.car.create({
      data: {
        ...dto,
        userId: userId,        // Owned by User
        organizationId: null,
      },
    });
  }

  // 2. FIND ALL (Context Aware)
  async findAll(userContext: any) {
    // If Manager/Driver -> Show Company Fleet
    if (userContext.organizationId) {
      return this.prisma.car.findMany({
        where: { organizationId: userContext.organizationId },
        include: { model: { include: { brand: true } } },
      });
    }

    // If Normal User -> Show Personal Cars
    return this.prisma.car.findMany({
      where: { userId: userContext.userId },
      include: { model: { include: { brand: true } } },
    });
  }

  // 3. FIND ONE (Security Check)
  async findOne(id: string, userContext: any) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { model: true },
    });

    if (!car) throw new NotFoundException('Car not found');

    // Security: Is this MY car? Or MY COMPANY'S car?
    const isMyPersonal = car.userId === userContext.userId;
    const isMyFleet = car.organizationId === userContext.organizationId;

    if (!isMyPersonal && !isMyFleet && userContext.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have access to this vehicle');
    }

    return car;
  }

  // 4. UPDATE
  async update(id: string, dto: UpdateCarDto, userContext: any) {
    // Reuse findOne to ensure security permissions
    await this.findOne(id, userContext); 

    return this.prisma.car.update({
      where: { id },
      data: dto,
    });
  }

  // 5. REMOVE
  async remove(id: string, userContext: any) {
    await this.findOne(id, userContext); // Security Check

    return this.prisma.car.delete({
      where: { id },
    });
  }
}