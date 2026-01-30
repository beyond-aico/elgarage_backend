import { Car } from '@prisma/client';
import { CreateCarDto } from '../dto/create-car.dto';
import { UpdateCarDto } from '../dto/update-car.dto';

export const CARS_REPOSITORY = 'CARS_REPOSITORY';

export interface ICarsRepository {
  create(userId: string, data: CreateCarDto): Promise<Car>;
  findAllByUserId(userId: string): Promise<Car[]>;
  findById(id: string): Promise<Car | null>;
  update(id: string, data: UpdateCarDto): Promise<Car>;
  delete(id: string): Promise<void>;
  findByIdentifier(identifier: {
    plateNumber?: string;
    vin?: string;
  }): Promise<Car | null>;
}
