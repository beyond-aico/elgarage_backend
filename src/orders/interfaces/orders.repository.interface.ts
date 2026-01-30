import { Order, OrderStatus } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export const ORDERS_REPOSITORY = 'ORDERS_REPOSITORY';

export interface IOrdersRepository {
  createTransactional(userId: string, data: CreateOrderDto): Promise<Order>;
  findAll(
    pagination: PaginationDto,
    userId?: string,
    status?: OrderStatus,
  ): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
