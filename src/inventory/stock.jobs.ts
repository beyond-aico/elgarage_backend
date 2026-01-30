import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class StockJobs {
  constructor(
    @Inject('STOCK_QUEUE')
    private readonly queue: Queue,
  ) {}

  async checkStock(itemId: string) {
    await this.queue.add('check-stock', { itemId });
  }
}
