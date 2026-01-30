import { Injectable } from '@nestjs/common';
import { IInventoryRepository } from '../interfaces/inventory.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { Part } from '@prisma/client';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdatePartDto } from '../dto/update-part.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryPrismaRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePartDto): Promise<Part> {
    return this.prisma.part.create({ data });
  }

  async findAll(pagination: PaginationDto, search?: string): Promise<Part[]> {
    const { skip = 0, take = 20 } = pagination;
    const where: any = {};

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
      orderBy: { quantity: 'asc' }, // Useful to see low stock first
    });
  }

  async findById(id: string): Promise<Part | null> {
    return this.prisma.part.findUnique({ where: { id } });
  }

  async findBySku(sku: string): Promise<Part | null> {
    return this.prisma.part.findUnique({ where: { sku } });
  }

  async update(id: string, data: UpdatePartDto): Promise<Part> {
    return this.prisma.part.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.part.delete({ where: { id } });
  }
}
