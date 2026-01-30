import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ORDERS_REPOSITORY } from './interfaces/orders.repository.interface';
import type { IOrdersRepository } from './interfaces/orders.repository.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
    private readonly carsService: CarsService, // To validate car ownership
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Verify Car Ownership
    await this.carsService.findOne(dto.carId, userId);

    // 2. Delegate to Repository for Transactional Creation
    return this.ordersRepository.createTransactional(userId, dto);
  }

  async findAll(pagination: PaginationDto, userId: string, role: UserRole) {
    // Admins see all; Users see only their own
    const filterUserId = role === UserRole.ADMIN ? undefined : userId;
    return this.ordersRepository.findAll(pagination, filterUserId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Security Check: Users can only see their own orders
    if (role !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    await this.ordersRepository.findById(id); // Ensure exists
    return this.ordersRepository.updateStatus(id, dto.status);
  }
}
