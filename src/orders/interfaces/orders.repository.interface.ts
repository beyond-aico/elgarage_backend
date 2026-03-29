import { Order, OrderItem, OrderStatus } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const ORDERS_REPOSITORY = 'ORDERS_REPOSITORY';

export type OrderWithItems = Order & { items: OrderItem[] };

export interface IOrdersRepository {
  createTransactional(
    userId: string,
    data: CreateOrderDto,
  ): Promise<OrderWithItems>;
  findAll(
    pagination: PaginationDto,
    userId?: string,
    status?: OrderStatus,
  ): Promise<OrderWithItems[]>;
  findById(id: string): Promise<OrderWithItems | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  reverseStockForOrder(orderId: string): Promise<void>;
}
