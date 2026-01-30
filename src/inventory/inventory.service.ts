import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { IInventoryRepository } from './interfaces/inventory.repository.interface';
import { INVENTORY_REPOSITORY } from './interfaces/inventory.repository.interface';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async create(dto: CreatePartDto) {
    const existing = await this.inventoryRepository.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException(`Part with SKU "${dto.sku}" already exists`);
    }
    return this.inventoryRepository.create(dto);
  }

  async findAll(pagination: PaginationDto, search?: string) {
    return this.inventoryRepository.findAll(pagination, search);
  }

  async findOne(id: string) {
    const part = await this.inventoryRepository.findById(id);
    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }
    return part;
  }

  async update(id: string, dto: UpdatePartDto) {
    await this.findOne(id); // Ensure exists

    if (dto.sku) {
      const duplicate = await this.inventoryRepository.findBySku(dto.sku);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Part with SKU "${dto.sku}" already exists`);
      }
    }

    return this.inventoryRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.inventoryRepository.delete(id);
  }
}
