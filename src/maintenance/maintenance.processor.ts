import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../common/queues/queue.module';
import { PrismaService } from '../prisma/prisma.service';

interface MaintenanceJobData {
  carId: string;
}

@Injectable()
export class MaintenanceProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MaintenanceProcessor.name);
  private worker: Worker<MaintenanceJobData>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.worker = new Worker<MaintenanceJobData>(
      'maintenance',
      (job: Job<MaintenanceJobData>) => this.handleCheckMaintenance(job),
      { connection: redisConnection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Maintenance job failed for car ${job?.data.carId}: ${err.message}`,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async handleCheckMaintenance(
    job: Job<MaintenanceJobData>,
  ): Promise<void> {
    const { carId } = job.data;

    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: { maintenanceRecords: true },
    });

    if (!car) {
      this.logger.warn(`Maintenance check: car ${carId} not found`);
      return;
    }

    const rules = await this.prisma.maintenanceRule.findMany({
      where: { modelId: car.modelId },
      include: { service: true },
    });

    for (const rule of rules) {
      const lastRecord = car.maintenanceRecords
        .filter((r) => r.serviceId === rule.serviceId)
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];

      if (!lastRecord) {
        this.logger.log(
          `[Alert] Service never performed: ${rule.service.name} — car ${car.plateNumber}`,
        );
        continue;
      }

      if (
        rule.intervalKm &&
        car.mileageKm - lastRecord.mileageKm >= rule.intervalKm
      ) {
        this.logger.log(
          `[Alert] Maintenance due: ${rule.service.name} — car ${car.plateNumber}`,
        );
      }
    }
  }
}
