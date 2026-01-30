import { Part } from '@prisma/client';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdatePartDto } from '../dto/update-part.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';

export interface IInventoryRepository {
  create(data: CreatePartDto): Promise<Part>;
  findAll(pagination: PaginationDto, search?: string): Promise<Part[]>;
  findById(id: string): Promise<Part | null>;
  findBySku(sku: string): Promise<Part | null>;
  update(id: string, data: UpdatePartDto): Promise<Part>;
  delete(id: string): Promise<void>;
}
