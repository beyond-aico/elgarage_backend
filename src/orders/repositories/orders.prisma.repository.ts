import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IOrdersRepository } from '../interfaces/orders.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersPrismaRepository implements IOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransactional(
    userId: string,
    data: CreateOrderDto,
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const orderItemsData: any[] = [];

      for (const item of data.items) {
        let price = 0;

        // 1. Handle Parts (Inventory)
        if (item.partId) {
          const part = await tx.part.findUnique({ where: { id: item.partId } });
          if (!part)
            throw new NotFoundException(`Part ID ${item.partId} not found`);
          if (part.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for part: ${part.name}`,
            );
          }

          price = Number(part.price);
          // Decrement Stock
          await tx.part.update({
            where: { id: part.id },
            data: { quantity: { decrement: item.quantity } },
          });

          orderItemsData.push({
            partId: item.partId,
            quantity: item.quantity,
            price: new Prisma.Decimal(price),
          });
        }
        // 2. Handle Services
        else if (item.serviceId) {
          const service = await tx.service.findUnique({ where: { id: item.serviceId } });
          if (!service)
            throw new NotFoundException(
              `Service ID ${item.serviceId} not found`,
            );

          price = Number(service.basePrice);
          orderItemsData.push({
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: new Prisma.Decimal(price),
          });
        } else {
          throw new BadRequestException(
            'Order item must have either partId or serviceId',
          );
        }

        totalPrice += price * item.quantity;
      }

      // 3. Create Order
      return tx.order.create({
        data: {
          userId,
          carId: data.carId,
          totalPrice: new Prisma.Decimal(totalPrice),
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { part: true, service: true },
          },
        },
      });
    });
  }

  async findAll(
    pagination: PaginationDto,
    userId?: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const { skip = 0, take = 20 } = pagination;
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.order.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { part: true, service: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { part: true, service: true },
        },
        car: {
          include: { model: { include: { brand: true } } },
        },
        user: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { part: true, service: true },
        },
      },
    });
  }
}
