import { Injectable } from '@nestjs/common';
import { IServicesRepository } from '../interfaces/services.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { Service, ServiceCategory } from '@prisma/client';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ServicesPrismaRepository implements IServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  async findAll(
    pagination: PaginationDto,
    category?: ServiceCategory,
    activeOnly: boolean = true,
  ): Promise<Service[]> {
    const { skip = 0, take = 20 } = pagination;
    const where: { category?: ServiceCategory; isActive?: boolean } = {};
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    return this.prisma.service.findMany({
      skip,
      take,
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Service | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Service | null> {
    return this.prisma.service.findFirst({ where: { name } });
  }

  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.delete({ where: { id } });
  }
}
