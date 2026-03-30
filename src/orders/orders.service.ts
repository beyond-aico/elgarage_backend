import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
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
import { assertValidTransition } from './order-state-machine';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
    private readonly carsService: CarsService,
    private readonly stockJobs: StockJobs,
  ) {}

  async create(userContext: AuthUser, dto: CreateOrderDto) {
    await this.carsService.findOne(dto.carId, userContext);

    const order = await this.ordersRepository.createTransactional(
      userContext.userId,
      dto,
    );

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

  async findAll(
    pagination: PaginationDto,
    userId: string,
    role: UserRole,
    userContext: AuthUser,
  ) {
    if (role === UserRole.ADMIN) {
      return this.ordersRepository.findAll(pagination, undefined);
    }

    if (role === UserRole.ACCOUNT_MANAGER) {
      if (!userContext.organizationId) {
        // Manager without an org — safe fallback to own orders only
        return this.ordersRepository.findAll(pagination, userId);
      }
      return this.ordersRepository.findAllByOrganization(
        pagination,
        userContext.organizationId,
      );
    }

    // USER and DRIVER see only their own orders
    return this.ordersRepository.findAll(pagination, userId);
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

  async cancelOrder(id: string, userContext: AuthUser) {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const isAdmin = userContext.role === UserRole.ADMIN;
    const isManager = userContext.role === UserRole.ACCOUNT_MANAGER;

    if (isManager) {
      // Account Manager can only cancel orders for cars in their org
      if (
        !order.car ||
        order.car.organizationId !== userContext.organizationId
      ) {
        throw new ForbiddenException(
          'You can only cancel orders for vehicles in your organization',
        );
      }
    } else if (!isAdmin) {
      // Regular user can only cancel their own orders
      if (order.userId !== userContext.userId) {
        throw new ForbiddenException('You cannot cancel this order');
      }
    }

    assertValidTransition(order.status, OrderStatus.CANCELLED);

    return this.ordersRepository.updateStatusAtomically(
      id,
      OrderStatus.CANCELLED,
    );
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userContext: AuthUser,
  ) {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    // Account Manager can only update orders for cars in their org
    if (userContext.role === UserRole.ACCOUNT_MANAGER) {
      if (
        !order.car ||
        order.car.organizationId !== userContext.organizationId
      ) {
        throw new ForbiddenException(
          'You can only update orders for vehicles in your organization',
        );
      }
    }

    assertValidTransition(order.status, dto.status);

    return this.ordersRepository.updateStatusAtomically(id, dto.status);
  }
}
