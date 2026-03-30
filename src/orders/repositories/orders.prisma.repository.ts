import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import {
  IOrdersRepository,
  OrderWithItems,
} from '../interfaces/orders.repository.interface';
import { assertValidTransition, isCancellation } from '../order-state-machine';

// Shared include shape — keeps all queries consistent
const ORDER_INCLUDE = {
  items: { include: { part: true, service: true } },
} as const;

@Injectable()
export class OrdersPrismaRepository implements IOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────

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
        include: ORDER_INCLUDE,
      });
    });
  }

  // ─── Read ──────────────────────────────────────────────────────────────

  async findAll(
    pagination: PaginationDto,
    userId?: string,
    status?: OrderStatus,
  ): Promise<PaginatedResult<OrderWithItems>> {
    const { skip = 0, take = 20 } = pagination;
    const where: Prisma.OrderWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findAllByOrganization(
    pagination: PaginationDto,
    organizationId: string,
  ): Promise<PaginatedResult<OrderWithItems>> {
    const { skip = 0, take = 20 } = pagination;

    const where: Prisma.OrderWhereInput = {
      car: {
        organizationId,
        deletedAt: null,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        ...ORDER_INCLUDE,
        car: { include: { model: { include: { brand: true } } } },
        user: true,
      },
    });
  }

  /**
   * Reads the current order with a row-level lock inside a serializable
   * transaction, validates the state transition, reverses stock if cancelling,
   * then writes the new status — all atomically.
   *
   * Using Prisma interactive transactions with READ COMMITTED isolation is the
   * default. For the strongest guarantee against concurrent double-cancellation
   * we issue a raw SELECT ... FOR UPDATE before reading the row, ensuring only
   * one concurrent caller proceeds at a time.
   */
  async updateStatusAtomically(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderWithItems> {
    return this.prisma.$transaction(
      async (tx) => {
        // Row-level lock — prevents concurrent transactions from reading the
        // same order status simultaneously and both passing the transition check.
        await tx.$executeRaw`
          SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE
        `;

        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        // Re-validate transition inside the lock — the state may have changed
        // between the service-layer check and this transaction acquiring the lock.
        assertValidTransition(order.status, newStatus);

        // Reverse stock for every part item if this is a cancellation
        if (isCancellation(newStatus)) {
          const partItems = order.items.filter((item) => item.partId !== null);
          for (const item of partItems) {
            await tx.part.update({
              where: { id: item.partId! },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: newStatus },
          include: ORDER_INCLUDE,
        });
      },
      {
        // SERIALIZABLE ensures the SELECT FOR UPDATE fully isolates the row
        // from concurrent writes during the transaction window.
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /** @deprecated Use updateStatusAtomically */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });
  }

  /** @deprecated Subsumed by updateStatusAtomically */
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
