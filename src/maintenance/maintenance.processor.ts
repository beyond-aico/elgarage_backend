// src/maintenance/maintenance.processor.ts
import { Worker } from 'bullmq';
import { redisConnection } from '../common/queues/queue.module';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common'; // Import Logger

interface MaintenanceJobData {
  carId: string;
}

const logger = new Logger('MaintenanceProcessor'); // Create Logger instance

new Worker<MaintenanceJobData>(
  'maintenance',
  async (job) => {
    const prisma = new PrismaService();
    const { carId } = job.data;

    // 1. Fetch Car AND its Model ID
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { maintenanceRecords: true },
    });

    if (!car) {
        logger.warn(`Car ${carId} not found during maintenance scan.`);
        return;
    }

    // 2. THE FIX: Fetch rules ONLY for this car's model (Optimization)
    const rules = await prisma.maintenanceRule.findMany({
      where: { modelId: car.modelId }, // <--- We added this filter
      include: { service: true },
    });

    for (const rule of rules) {
      // Find the last time this specific service was done
      const lastRecord = car.maintenanceRecords
        .filter((r) => r.serviceId === rule.serviceId)
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];

      // Logic: If never performed, or mileage exceeded
      if (!lastRecord) {
        logger.log(`[Alert] Service never performed: ${rule.service.name} for Car ${car.plateNumber}`);
        continue;
      }

      if (rule.intervalKm && (car.mileageKm - lastRecord.mileageKm >= rule.intervalKm)) {
        logger.log(`[Alert] Maintenance Due: ${rule.service.name} for Car ${car.plateNumber}`);
      }
    }
    
    await prisma.$disconnect();
  },
  { connection: redisConnection },
);