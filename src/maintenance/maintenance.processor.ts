import { Worker } from 'bullmq';
import { redisConnection } from '../common/queues/queue.module';
import { PrismaService } from '../prisma/prisma.service';

interface MaintenanceJobData {
  carId: string;
}

new Worker<MaintenanceJobData>(
  'maintenance',
  async (job) => {
    const prisma = new PrismaService();

    const { carId } = job.data;

    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { maintenanceRecords: true },
    });

    if (!car) return;

    // FIX 1: Include the Service relation so we can access the name later
    const rules = await prisma.maintenanceRule.findMany({
      include: { service: true },
    });

    for (const rule of rules) {
      // FIX 2: Match using serviceId instead of serviceName
      const last = car.maintenanceRecords
        .filter((r) => r.serviceId === rule.serviceId)
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];

      if (!last) {
        // FIX 3: Log using the related service name
        console.log(`Maintenance due: ${rule.service.name}`);
        continue;
      }

      if (
        rule.intervalKm &&
        car.mileageKm - last.mileageKm >= rule.intervalKm
      ) {
        // FIX 4: Log using the related service name
        console.log(`Maintenance due by KM: ${rule.service.name}`);
      }
    }
    await prisma.$disconnect();
  },
  { connection: redisConnection },
);
