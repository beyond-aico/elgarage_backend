import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IOrdersRepository,
  ORDERS_REPOSITORY,
} from './interfaces/orders.repository.interface';
import { CarsService } from '../cars/cars.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
    private readonly carsService: CarsService,
  ) {}

  async create(userContext: { userId: string }, dto: CreateOrderDto) {
    // Throws ForbiddenException / NotFoundException if caller doesn't own the car
    await this.carsService.findOne(dto.carId, userContext);

    return this.ordersRepository.createTransactional(userContext.userId, dto);
  }

  async findAll(pagination: PaginationDto, userId: string, role: UserRole) {
    // Admins and account managers see all orders; regular users see only theirs
    const filterUserId =
      role === UserRole.ADMIN || role === UserRole.ACCOUNT_MANAGER
        ? undefined
        : userId;

    return this.ordersRepository.findAll(pagination, filterUserId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const order = await this.ordersRepository.findById(id);

    if (!order) throw new NotFoundException('Order not found');

    // Admins and account managers can see any order
    const isPrivileged =
      role === UserRole.ADMIN || role === UserRole.ACCOUNT_MANAGER;

    if (!isPrivileged && order.userId !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }
}
