import { Service, ServiceCategory } from '@prisma/client';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const SERVICES_REPOSITORY = 'SERVICES_REPOSITORY';

export interface IServicesRepository {
  create(data: CreateServiceDto): Promise<Service>;
  findAll(
    pagination: PaginationDto,
    category?: ServiceCategory,
    activeOnly?: boolean,
  ): Promise<Service[]>;
  findById(id: string): Promise<Service | null>;
  findByName(name: string): Promise<Service | null>;
  update(id: string, data: UpdateServiceDto): Promise<Service>;
  delete(id: string): Promise<void>;
}
