import { Worker } from 'bullmq';
import { redisConnection } from '../common/queues/queue.module';
import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

new Worker<{ itemId: string }>(
  'stock',
  async (job) => {
    const prisma = new PrismaService();
    const { itemId } = job.data;

    const item = await prisma.part.findUnique({
      where: { id: itemId },
    });

    if (item && item.quantity <= LOW_STOCK_THRESHOLD) {
      console.warn(`LOW STOCK ALERT: ${item.name} (${item.quantity})`);
      // email / Slack / webhook later
    }
  },
  { connection: redisConnection },
);
