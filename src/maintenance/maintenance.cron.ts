import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaintenanceJobs } from './maintenance.jobs';

const CHUNK_SIZE = 500;

@Injectable()
export class MaintenanceCron {
  private readonly logger = new Logger(MaintenanceCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly maintenanceJobs: MaintenanceJobs,
  ) {}

  @Cron('0 2 * * *')
  async scanAllCars() {
    // Exclude soft-deleted cars
    const cars = await this.prisma.car.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    this.logger.log(
      `Maintenance cron: queuing ${cars.length} active cars for check`,
    );

    for (let i = 0; i < cars.length; i += CHUNK_SIZE) {
      const chunk = cars.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((car) => this.maintenanceJobs.scheduleCheck(car.id)),
      );
    }
  }
}
