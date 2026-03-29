import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

import {
  IOrdersRepository,
  OrderWithItems,
} from '../interfaces/orders.repository.interface';

@Injectable()
export class OrdersPrismaRepository implements IOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransactional(
    userId: string,
    data: CreateOrderDto,
  ): Promise<OrderWithItems> {
    return this.prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const item of data.items) {
        let price = 0;

        if (item.partId) {
          // Exclude soft-deleted parts
          const part = await tx.part.findFirst({
            where: { id: item.partId, deletedAt: null },
          });
          if (!part) {
            throw new NotFoundException(
              `Part ID ${item.partId} not found or has been removed`,
            );
          }
          if (part.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for part "${part.name}": ${part.quantity} available, ${item.quantity} requested`,
            );
          }

          price = Number(part.price);
          await tx.part.update({
            where: { id: part.id },
            data: { quantity: { decrement: item.quantity } },
          });

          orderItemsData.push({
            partId: item.partId,
            quantity: item.quantity,
            price: new Prisma.Decimal(price),
          });
        } else if (item.serviceId) {
          // Exclude soft-deleted and inactive services
          const service = await tx.service.findFirst({
            where: { id: item.serviceId, deletedAt: null, isActive: true },
          });
          if (!service) {
            throw new NotFoundException(
              `Service ID ${item.serviceId} not found, inactive, or has been removed`,
            );
          }

          price = Number(service.basePrice);
          orderItemsData.push({
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: new Prisma.Decimal(price),
          });
        } else {
          throw new BadRequestException(
            'Each order item must have either a partId or a serviceId',
          );
        }

        totalPrice += price * item.quantity;
      }

      return tx.order.create({
        data: {
          userId,
          carId: data.carId,
          totalPrice: new Prisma.Decimal(totalPrice),
          items: { create: orderItemsData },
        },
        include: {
          items: { include: { part: true, service: true } },
        },
      });
    });
  }

  async findAll(
    pagination: PaginationDto,
    userId?: string,
    status?: OrderStatus,
  ): Promise<OrderWithItems[]> {
    const { skip = 0, take = 20 } = pagination;
    const where: Prisma.OrderWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.order.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { part: true, service: true } },
      },
    });
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { part: true, service: true } },
        car: { include: { model: { include: { brand: true } } } },
        user: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { part: true, service: true } },
      },
    });
  }

  /**
   * Reverse stock decrements for all part items in an order.
   * Called inside a transaction when an order is cancelled.
   */
  async reverseStockForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    await this.prisma.$transaction(
      order.items
        .filter((item) => item.partId !== null)
        .map((item) =>
          this.prisma.part.update({
            where: { id: item.partId! },
            data: { quantity: { increment: item.quantity } },
          }),
        ),
    );
  }
}
