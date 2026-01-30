import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SERVICES_REPOSITORY } from './interfaces/services.repository.interface';
import type { IServicesRepository } from './interfaces/services.repository.interface';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ServiceCategory } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private readonly servicesRepository: IServicesRepository,
  ) {}

  async create(dto: CreateServiceDto) {
    // Check for duplicate name
    const existing = await this.servicesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Service with name "${dto.name}" already exists`,
      );
    }

    return this.servicesRepository.create(dto);
  }

  async findAll(
    pagination: PaginationDto,
    category?: ServiceCategory,
    isAdmin: boolean = false,
  ) {
    // If Admin, show all. If Customer, show only active services.
    const activeOnly = !isAdmin;
    return this.servicesRepository.findAll(pagination, category, activeOnly);
  }

  async findOne(id: string) {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id); // Ensure exists

    if (dto.name) {
      const duplicate = await this.servicesRepository.findByName(dto.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Service with name "${dto.name}" already exists`,
        );
      }
    }

    return this.servicesRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.servicesRepository.delete(id);
  }
}
