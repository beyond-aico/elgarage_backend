import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Car, UserRole } from '@prisma/client';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { AuthUser } from '../auth/types/auth-user.type';
import {
  ICarsRepository,
  CARS_REPOSITORY,
} from './interfaces/cars.repository.interface';

const PERSONAL_CAR_LIMIT = 2;
const FLEET_CAR_LIMIT = 50;

@Injectable()
export class CarsService {
  constructor(
    @Inject(CARS_REPOSITORY)
    private readonly carsRepository: ICarsRepository,
  ) {}

  async create(userContext: AuthUser, dto: CreateCarDto) {
    if (userContext.organizationId) {
      return this.createFleetCar(userContext.organizationId, dto);
    }
    return this.createPersonalCar(userContext.userId, dto);
  }

  private async createFleetCar(orgId: string, dto: CreateCarDto) {
    const currentCount = await this.carsRepository.countByOrganizationId(orgId);
    if (currentCount >= FLEET_CAR_LIMIT) {
      throw new ForbiddenException(
        `Fleet limit reached (${FLEET_CAR_LIMIT}). Contact sales to upgrade.`,
      );
    }
    return this.carsRepository.createFleet(orgId, dto);
  }

  private async createPersonalCar(userId: string, dto: CreateCarDto) {
    const currentCount = await this.carsRepository.countByUserId(userId);
    if (currentCount >= PERSONAL_CAR_LIMIT) {
      throw new ForbiddenException(
        `Free accounts are limited to ${PERSONAL_CAR_LIMIT} vehicles. Please upgrade.`,
      );
    }
    return this.carsRepository.createPersonal(userId, dto);
  }

  async findAll(userContext: AuthUser) {
    if (userContext.organizationId) {
      return this.carsRepository.findAllByOrganizationId(
        userContext.organizationId,
      );
    }
    return this.carsRepository.findAllByUserId(userContext.userId);
  }

  async findOne(id: string, userContext: AuthUser) {
    const car = await this.carsRepository.findById(id);

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    const isMyPersonal = car.userId === userContext.userId;
    const isMyFleet =
      userContext.organizationId != null &&
      car.organizationId === userContext.organizationId;

    if (!isMyPersonal && !isMyFleet && userContext.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this vehicle');
    }

    return car;
  }

  async update(id: string, dto: UpdateCarDto, userContext: AuthUser) {
    await this.findOne(id, userContext);
    return this.carsRepository.update(id, dto);
  }

  async assignBarcode(
    carId: string,
    barcode: string,
    userContext: AuthUser,
  ): Promise<Car> {
    const car = await this.findOne(carId, userContext);

    if (!car.isFleetVehicle) {
      throw new ForbiddenException(
        'Barcodes can only be assigned to fleet vehicles',
      );
    }

    return this.carsRepository.assignBarcode(carId, barcode);
  }

  async remove(id: string, userContext: AuthUser) {
    await this.findOne(id, userContext);
    return this.carsRepository.softDelete(id);
  }
}
