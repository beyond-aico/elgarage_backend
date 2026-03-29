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
  private worker: Worker<StockJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<StockJobData>(
      'stock',
      (job: Job<StockJobData>) => this.handleCheckStock(job),
      { connection: redisConnection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Stock job failed for part ${job?.data.itemId}: ${err.message}`,
      );
    });
  }

  async onModuleDestroy() {
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

    // Guard: skip if threshold is not configured for this part
    if (item.lowStockThreshold == null) {
      return;
    }

    if (item.quantity <= item.lowStockThreshold) {
      // Fire the structured notification — currently logs to pino, ready for
      // email/Slack/webhook by swapping the body of sendLowStockAlert().
      this.notifications.sendLowStockAlert(
        item.name,
        item.sku,
        item.quantity,
        item.lowStockThreshold,
      );
    }
  }
}
