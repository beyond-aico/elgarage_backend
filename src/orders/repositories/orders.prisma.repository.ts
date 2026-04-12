import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Order, OrderStatus, Prisma, Part, Service } from '@prisma/client';
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
      // ── Step 1: collect all IDs up front ────────────────────────────
      const partIds: string[] = [
        ...new Set(
          data.items
            .filter((i): i is typeof i & { partId: string } => i.partId != null)
            .map((i) => i.partId),
        ),
      ];

      const serviceIds: string[] = [
        ...new Set(
          data.items
            .filter(
              (i): i is typeof i & { serviceId: string } => i.serviceId != null,
            )
            .map((i) => i.serviceId),
        ),
      ];

      // ── Step 2: bulk fetch parts and services in two queries ─────────
      const [parts, services]: [Part[], Service[]] = await Promise.all([
        partIds.length > 0
          ? tx.part.findMany({
              where: { id: { in: partIds }, deletedAt: null },
            })
          : Promise.resolve([] as Part[]),

        serviceIds.length > 0
          ? tx.service.findMany({
              where: {
                id: { in: serviceIds },
                deletedAt: null,
                isActive: true,
              },
            })
          : Promise.resolve([] as Service[]),
      ]);

      // ── Step 3: index into maps for O(1) lookup per item ─────────────
      const partMap = new Map<string, Part>(parts.map((p) => [p.id, p]));
      const serviceMap = new Map<string, Service>(
        services.map((s) => [s.id, s]),
      );

      // ── Step 4: validate stock and compute totals ────────────────────
      let totalPrice = 0;
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

      // Accumulate stock decrements per part so duplicate partIds in the
      // same order are collapsed into a single update.
      const stockDecrements = new Map<string, number>();

      for (const item of data.items) {
        if (item.partId) {
          const part = partMap.get(item.partId);

          if (!part) {
            throw new NotFoundException(
              `Part ID ${item.partId} not found or has been removed`,
            );
          }

          const alreadyRequested = stockDecrements.get(part.id) ?? 0;
          const totalRequested = alreadyRequested + item.quantity;

          if (part.quantity < totalRequested) {
            throw new BadRequestException(
              `Insufficient stock for part "${part.name}": ` +
                `${part.quantity} available, ${totalRequested} requested`,
            );
          }

          stockDecrements.set(part.id, totalRequested);

          const price = Number(part.price);
          totalPrice += price * item.quantity;

          orderItemsData.push({
            partId: item.partId,
            quantity: item.quantity,
            price: new Prisma.Decimal(price),
          });
        } else if (item.serviceId) {
          const service = serviceMap.get(item.serviceId);

          if (!service) {
            throw new NotFoundException(
              `Service ID ${item.serviceId} not found, inactive, or has been removed`,
            );
          }

          const price = Number(service.basePrice);
          totalPrice += price * item.quantity;

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
      }

      // ── Step 5: apply all stock decrements in parallel ───────────────
      await Promise.all(
        Array.from(stockDecrements.entries()).map(([partId, quantity]) =>
          tx.part.update({
            where: { id: partId },
            data: { quantity: { decrement: quantity } },
          }),
        ),
      );

      // ── Step 6: create the order ─────────────────────────────────────
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

  async updateStatusAtomically(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderWithItems> {
    return this.prisma.$transaction(
      async (tx) => {
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

        assertValidTransition(order.status, newStatus);

        if (isCancellation(newStatus)) {
          const partItems = order.items.filter((item) => item.partId !== null);

          await Promise.all(
            partItems.map((item) =>
              tx.part.update({
                where: { id: item.partId! },
                data: { quantity: { increment: item.quantity } },
              }),
            ),
          );
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: newStatus },
          include: ORDER_INCLUDE,
        });
      },
      {
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
