import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaintenanceJobs } from './maintenance.jobs';

/** How many cars to enqueue in a single Promise.all batch. */
const CHUNK_SIZE = 500;

@Injectable()
export class MaintenanceCron {
  private readonly logger = new Logger(MaintenanceCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly maintenanceJobs: MaintenanceJobs,
  ) {}

  @Cron('0 2 * * *') // daily at 02:00
  async scanAllCars() {
    const cars = await this.prisma.car.findMany({ select: { id: true } });
    this.logger.log(`Maintenance cron: queuing ${cars.length} cars for check`);

    // Process in chunks so a very large fleet doesn't open thousands of
    // Redis connections simultaneously. Within each chunk jobs are parallel;
    // chunks run sequentially.
    for (let i = 0; i < cars.length; i += CHUNK_SIZE) {
      const chunk = cars.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((car) => this.maintenanceJobs.scheduleCheck(car.id)),
      );
    }
  }
}
