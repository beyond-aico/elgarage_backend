import { Car } from '@prisma/client';
import { CreateCarDto } from '../dto/create-car.dto';
import { UpdateCarDto } from '../dto/update-car.dto';

export const CARS_REPOSITORY = 'CARS_REPOSITORY';

export interface ICarsRepository {
  /** Create a personal car owned by userId */
  createPersonal(userId: string, data: CreateCarDto): Promise<Car>;

  /** Create a fleet car owned by an organization */
  createFleet(organizationId: string, data: CreateCarDto): Promise<Car>;

  /** Count non-deleted cars for a user (personal limit check) */
  countByUserId(userId: string): Promise<number>;

  /** Count non-deleted cars for an org (fleet limit check) */
  countByOrganizationId(organizationId: string): Promise<number>;

  findAllByUserId(userId: string): Promise<Car[]>;
  findAllByOrganizationId(organizationId: string): Promise<Car[]>;
  findById(id: string): Promise<Car | null>;
  update(id: string, data: UpdateCarDto): Promise<Car>;
  softDelete(id: string): Promise<void>;

  findByIdentifier(identifier: {
    plateNumber?: string;
    vin?: string;
  }): Promise<Car | null>;
}
