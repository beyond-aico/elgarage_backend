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

interface MaintenanceJobData {
  carId: string;
}

@Injectable()
export class MaintenanceProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MaintenanceProcessor.name);
  private worker?: Worker<MaintenanceJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<MaintenanceJobData>(
      'maintenance',
      (job: Job<MaintenanceJobData>) => this.handleCheckMaintenance(job),
      { connection: redisConnection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Maintenance job failed for car ${job?.data.carId ?? 'unknown'}: ${err.message}`,
        err.stack,
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Maintenance worker error: ${err.message}`, err.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async handleCheckMaintenance(
    job: Job<MaintenanceJobData>,
  ): Promise<void> {
    const { carId } = job.data;

    // Include the car's owner so we have an email address for notifications.
    // For fleet cars userId is null — in that case we fall back to a structured
    // log only (no individual owner to email).
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: {
        maintenanceRecords: true,
        user: { select: { email: true } },
      },
    });

    if (!car) {
      this.logger.warn(`Maintenance check: car ${carId} not found`);
      return;
    }

    const rules = await this.prisma.maintenanceRule.findMany({
      where: { modelId: car.modelId },
      include: { service: true },
    });

    // The recipient email is the personal owner's address, or undefined for
    // fleet-owned cars (organizationId set, userId null).
    const recipientEmail = car.user?.email ?? null;

    for (const rule of rules) {
      const lastRecord = car.maintenanceRecords
        .filter((r) => r.serviceId === rule.serviceId)
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];

      if (!lastRecord) {
        this.logger.log(
          `[Alert] Service never performed: ${rule.service.name} — car ${car.plateNumber}`,
        );

        if (recipientEmail) {
          this.notifications.sendMaintenanceAlert(
            recipientEmail,
            car.plateNumber,
            rule.service.name,
            'NEVER_PERFORMED',
          );
        }
        continue;
      }

      if (
        rule.intervalKm &&
        car.mileageKm - lastRecord.mileageKm >= rule.intervalKm
      ) {
        this.logger.log(
          `[Alert] Maintenance due: ${rule.service.name} — car ${car.plateNumber}`,
        );

        if (recipientEmail) {
          this.notifications.sendMaintenanceAlert(
            recipientEmail,
            car.plateNumber,
            rule.service.name,
            'INTERVAL_EXCEEDED',
          );
        }
      }
    }
  }
}
