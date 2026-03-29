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
import { StockJobs } from '../inventory/stock.jobs';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../auth/types/auth-user.type';
import { assertValidTransition, isCancellation } from './order-state-machine';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
    private readonly carsService: CarsService,
    private readonly stockJobs: StockJobs,
  ) {}

  async create(userContext: AuthUser, dto: CreateOrderDto) {
    // Ownership check — throws ForbiddenException / NotFoundException
    await this.carsService.findOne(dto.carId, userContext);

    // 👈 Note: Make sure the repository interface returns the nested items!
    const order = await this.ordersRepository.createTransactional(
      userContext.userId,
      dto,
    );

    // Trigger low-stock checks for every part in the order (fire-and-forget)
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.partId) {
          this.stockJobs.checkStock(item.partId).catch(() => {
            // Non-critical — a failed enqueue must not fail the order response
          });
        }
      }
    }

    return order;
  }

  async findAll(pagination: PaginationDto, userId: string, role: UserRole) {
    const filterUserId =
      role === UserRole.ADMIN || role === UserRole.ACCOUNT_MANAGER
        ? undefined
        : userId;

    return this.ordersRepository.findAll(pagination, filterUserId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const isPrivileged =
      role === UserRole.ADMIN || role === UserRole.ACCOUNT_MANAGER;

    if (!isPrivileged && order.userId !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userContext: AuthUser,
  ) {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    // 👈 THE FIX: Enforce authorization for status updates
    const isPrivileged =
      userContext.role === UserRole.ADMIN ||
      userContext.role === UserRole.ACCOUNT_MANAGER;

    // A regular user can only update their own order (e.g., to cancel it)
    if (!isPrivileged && order.userId !== userContext.userId) {
      throw new ForbiddenException(
        'You do not have permission to update this order',
      );
    }

    // Validate the state transition
    assertValidTransition(order.status, dto.status);

    // Reverse stock on cancellation
    if (isCancellation(dto.status)) {
      await this.ordersRepository.reverseStockForOrder(id);
    }

    return this.ordersRepository.updateStatus(id, dto.status);
  }
}
