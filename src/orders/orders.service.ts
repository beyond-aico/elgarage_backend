import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userContext: any, dto: CreateOrderDto) {
    // 1. Validate Car Ownership (Security)
    const car = await this.prisma.car.findUnique({ where: { id: dto.carId } });
    if (!car) throw new NotFoundException('Car not found');

    const isMyPersonal = car.userId === userContext.userId;
    const isMyFleet = car.organizationId === userContext.organizationId;
    if (!isMyPersonal && !isMyFleet) {
      throw new ForbiddenException('You cannot order for a car you do not own.');
    }

    // 2. THE TRANSACTION (All or Nothing)
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      // 3. Process Items
      for (const item of dto.items) {
        let price = 0;
        let finalPartId = null;
        let finalServiceId = null;

        // A. Handle PARTS
        if (item.partId) {
          const part = await tx.part.findUnique({ where: { id: item.partId } });
          if (!part) throw new NotFoundException(`Part ${item.partId} not found`);
          
          // Stock Check
          if (part.quantity < item.quantity) {
            throw new BadRequestException(`Insufficient stock for part: ${part.name}`);
          }

          // DEDUCT STOCK
          await tx.part.update({
            where: { id: part.id },
            data: { quantity: { decrement: item.quantity } },
          });

          price = Number(part.price);
          finalPartId = part.id;
        } 
        // B. Handle SERVICES
        else if (item.serviceId) {
          const service = await tx.service.findUnique({ where: { id: item.serviceId } });
          if (!service) throw new NotFoundException(`Service ${item.serviceId} not found`);
          
          price = Number(service.basePrice);
          finalServiceId = service.id;
        } else {
          throw new BadRequestException('Item must be a Part or a Service');
        }

        // Add to total
        totalAmount += price * item.quantity;

        // Prepare Item Data (Snapshotting Price)
        orderItemsData.push({
          partId: finalPartId,
          serviceId: finalServiceId,
          quantity: item.quantity,
          price: price, // IMPORTANT: Saving the price at THIS moment
        });
      }

      // 4. Create the Order Header
      return tx.order.create({
        data: {
          userId: userContext.userId, // Who placed it?
          carId: dto.carId,
          totalPrice: totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });
    });
  }

  // Find My Orders
  async findAll(userContext: any) {
    // If Admin/Manager, maybe logic differs, but here is basic User view
    return this.prisma.order.findMany({
      where: { userId: userContext.userId },
      include: { 
        items: { include: { part: true, service: true } },
        car: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, car: true }
    });
  }
}