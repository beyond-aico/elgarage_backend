import { Car, Order, OrderItem, OrderStatus } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

export const ORDERS_REPOSITORY = 'ORDERS_REPOSITORY';

export type OrderWithItems = Order & {
  items: OrderItem[];
  car?: Car;
};

export interface IOrdersRepository {
  createTransactional(
    userId: string,
    data: CreateOrderDto,
  ): Promise<OrderWithItems>;

  findAll(
    pagination: PaginationDto,
    userId?: string,
    status?: OrderStatus,
  ): Promise<PaginatedResult<OrderWithItems>>;

  findAllByOrganization(
    pagination: PaginationDto,
    organizationId: string,
  ): Promise<PaginatedResult<OrderWithItems>>;

  findById(id: string): Promise<OrderWithItems | null>;

  updateStatusAtomically(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderWithItems>;

  /** @deprecated Use updateStatusAtomically instead */
  updateStatus(id: string, status: OrderStatus): Promise<Order>;

  reverseStockForOrder(orderId: string): Promise<void>;
}
