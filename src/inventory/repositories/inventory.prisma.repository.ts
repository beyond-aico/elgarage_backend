import { Injectable } from '@nestjs/common';
import { IInventoryRepository } from '../interfaces/inventory.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { Part, Prisma } from '@prisma/client';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdatePartDto } from '../dto/update-part.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryPrismaRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePartDto): Promise<Part> {
    const { compatibleModelIds, ...partData } = data;

    return this.prisma.part.create({
      data: {
        name: partData.name,
        sku: partData.sku,
        description: partData.description ?? null,
        price: partData.price,
        quantity: partData.quantity, // explicit mapping — no spread ambiguity
        lowStockThreshold: partData.lowStockThreshold ?? 5,
        location: partData.location ?? null,
        compatibleModels: {
          connect: compatibleModelIds.map((id) => ({ id })),
        },
      },
    });
  }

  async findAll(pagination: PaginationDto, search?: string): Promise<Part[]> {
    const { skip = 0, take = 20 } = pagination;

    const where: Prisma.PartWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.part.findMany({
      skip,
      take,
      where,
      orderBy: { quantity: 'asc' },
    });
  }

  async findById(id: string): Promise<Part | null> {
    return this.prisma.part.findFirst({ where: { id, deletedAt: null } });
  }

  async findBySku(sku: string): Promise<Part | null> {
    return this.prisma.part.findFirst({ where: { sku, deletedAt: null } });
  }

  async update(id: string, data: UpdatePartDto): Promise<Part> {
    const { compatibleModelIds, ...partData } = data;

    const updateData: Prisma.PartUpdateInput = { ...partData };

    if (compatibleModelIds !== undefined) {
      updateData.compatibleModels = {
        set: compatibleModelIds.map((modelId) => ({ id: modelId })),
      };
    }

    return this.prisma.part.update({ where: { id }, data: updateData });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.part.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
