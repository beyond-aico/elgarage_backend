import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SERVICES_REPOSITORY } from './interfaces/services.repository.interface';
import type { IServicesRepository } from './interfaces/services.repository.interface';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Service, ServiceCategory } from '@prisma/client';
import { CACHE_TTL } from '../config/cache.config';

const CACHE_KEY = {
  LIST: (category: string, activeOnly: boolean, skip: number, take: number) =>
    `services:list:${category}:${activeOnly}:${skip}:${take}`,
  ALL_LIST_PREFIX: 'services:list:',
} as const;

@Injectable()
export class ServicesService {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private readonly servicesRepository: IServicesRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    const existing = await this.servicesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Service with name "${dto.name}" already exists`,
      );
    }

    const service = await this.servicesRepository.create(dto);
    await this.invalidateListCache();
    return service;
  }

  async findAll(
    pagination: PaginationDto,
    category?: ServiceCategory,
    isAdmin: boolean = false,
  ): Promise<Service[]> {
    const activeOnly = !isAdmin;
    const skip = pagination.skip ?? 0;
    const take = pagination.take ?? 20;
    const key = CACHE_KEY.LIST(category ?? 'all', activeOnly, skip, take);

    // Explicitly type the cache.get call so TypeScript knows what comes back.
    const cached = await this.cache.get<Service[]>(key);
    if (cached) return cached;

    const services = await this.servicesRepository.findAll(
      pagination,
      category,
      activeOnly,
    );

    await this.cache.set(key, services, CACHE_TTL.SERVICES);

    return services;
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    await this.findOne(id);

    if (dto.name) {
      const duplicate = await this.servicesRepository.findByName(dto.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Service with name "${dto.name}" already exists`,
        );
      }
    }

    const service = await this.servicesRepository.update(id, dto);
    await this.invalidateListCache();
    return service;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.servicesRepository.softDelete(id);
    await this.invalidateListCache();
  }

  private async invalidateListCache(): Promise<void> {
    const registry =
      (await this.cache.get<string[]>(CACHE_KEY.ALL_LIST_PREFIX)) ?? [];

    await Promise.all([
      ...registry.map((key) => this.cache.del(key)),
      this.cache.del(CACHE_KEY.ALL_LIST_PREFIX),
    ]);
  }
}
