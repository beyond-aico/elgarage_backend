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
    // Extract model IDs to handle the relation separately
    const { compatibleModelIds, ...partData } = data;

    return this.prisma.part.create({
      data: {
        ...partData,
        // Explicitly connect relations on creation
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
      orderBy: { quantity: 'asc' }, // Low stock first
    });
  }

  async findById(id: string): Promise<Part | null> {
    return this.prisma.part.findFirst({ where: { id, deletedAt: null } });
  }

  async findBySku(sku: string): Promise<Part | null> {
    return this.prisma.part.findFirst({ where: { sku, deletedAt: null } });
  }

  async update(id: string, data: UpdatePartDto): Promise<Part> {
    // Destructure to separate the relational array from standard scalar fields
    const { compatibleModelIds, ...partData } = data;

    // Type the update payload strictly
    const updateData: Prisma.PartUpdateInput = {
      ...partData,
    };

    // If the update payload includes a new array of compatible model IDs,
    // use Prisma's 'set' to completely overwrite the existing relationships.
    // (If compatibleModelIds is undefined, this block is skipped safely).
    if (compatibleModelIds !== undefined) {
      updateData.compatibleModels = {
        set: compatibleModelIds.map((modelId) => ({ id: modelId })),
      };
    }

    return this.prisma.part.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.part.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
