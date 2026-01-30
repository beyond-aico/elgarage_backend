import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MaintenanceJobs {
  constructor(
    @Inject('MAINTENANCE_QUEUE')
    private readonly queue: Queue,
  ) {}

  async scheduleCheck(carId: string) {
    await this.queue.add(
      'check-maintenance',
      { carId },
      { delay: 60_000 }, // 1 minute (demo); cron later
    );
  }
}
