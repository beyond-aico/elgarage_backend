import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../common/queues/queue.module';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface StockJobData {
  itemId: string;
}

@Injectable()
export class StockProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StockProcessor.name);
  private worker?: Worker<StockJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<StockJobData>(
      'stock',
      (job: Job<StockJobData>) => this.handleCheckStock(job),
      { connection: redisConnection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Stock job failed for part ${job?.data.itemId ?? 'unknown'}: ${err.message}`,
        err.stack,
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Stock worker error: ${err.message}`, err.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async handleCheckStock(job: Job<StockJobData>): Promise<void> {
    const { itemId } = job.data;

    const item = await this.prisma.part.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      this.logger.warn(`Stock check: part ${itemId} not found`);
      return;
    }

    if (item.lowStockThreshold == null) {
      return;
    }

    if (item.quantity <= item.lowStockThreshold) {
      this.notifications.sendLowStockAlert(
        item.name,
        item.sku,
        item.quantity,
        item.lowStockThreshold,
      );
    }
  }
}
