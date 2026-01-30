import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CARS_REPOSITORY } from './interfaces/cars.repository.interface';
import type { ICarsRepository } from './interfaces/cars.repository.interface';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarsService {
  constructor(
    @Inject(CARS_REPOSITORY)
    private readonly carsRepository: ICarsRepository,
  ) {}

  async create(userId: string, dto: CreateCarDto) {
    // Plate number is mandatory → always check
    await this.checkUniqueness({
      plateNumber: dto.plateNumber,
      ...(dto.vin ? { vin: dto.vin } : {}),
    });

    return this.carsRepository.create(userId, dto);
  }

  async findAllMyCars(userId: string) {
    return this.carsRepository.findAllByUserId(userId);
  }

  async findOne(id: string, userId: string) {
    const car = await this.carsRepository.findById(id);

    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    if (car.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this car',
      );
    }

    return car;
  }

  async update(id: string, userId: string, dto: UpdateCarDto) {
    const car = await this.findOne(id, userId);

    if (dto.plateNumber || dto.vin) {
      const plateNumber = car.plateNumber as string;

      const identifier: { plateNumber: string; vin?: string } = {
        plateNumber,
      };

      if (dto.plateNumber) {
        identifier.plateNumber = dto.plateNumber;
      }

      if (dto.vin) {
        identifier.vin = dto.vin;
      }

      await this.checkUniqueness(identifier, id);
    }

    return this.carsRepository.update(id, dto);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.carsRepository.delete(id);
  }

  /**
   * Unified uniqueness check (Egypt-friendly)
   */
  private async checkUniqueness(
    identifier: {
      plateNumber?: string;
      vin?: string;
    },
    excludeId?: string,
  ) {
    if (!identifier.plateNumber && !identifier.vin) {
      throw new BadRequestException(
        'At least plate number or VIN must be provided',
      );
    }

    const existing = await this.carsRepository.findByIdentifier(identifier);

    if (existing && existing.id !== excludeId) {
      if (
        identifier.plateNumber &&
        existing.plateNumber === identifier.plateNumber
      ) {
        throw new ConflictException(
          'Car with this plate number already exists',
        );
      }

      if (identifier.vin && existing.vin === identifier.vin) {
        throw new ConflictException(
          'Car with this VIN / chassis number already exists',
        );
      }
    }
  }
}
