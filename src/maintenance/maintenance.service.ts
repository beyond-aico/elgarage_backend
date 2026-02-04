import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceRepository } from './repositories/maintenance.prisma.repository';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly repository: MaintenanceRepository,
    private readonly prisma: PrismaService, // Direct access needed for Car fetch
  ) {}

  // --- ADMIN: Manage DNA ---
  async createRule(dto: CreateMaintenanceRuleDto) {
    // Check if rule already exists for this car/service combo to avoid crash
    const existing = await this.repository.findOneRule(dto.serviceId, dto.modelId);
    if (existing) {
      throw new Error('Rule already exists for this car model and service.');
    }
    return this.repository.createRule(dto);
  }

  async getRulesForModel(modelId: string) {
    return this.repository.findRulesByModel(modelId);
  }

  // --- CORE FEATURE: Calculate Car Health ---
  async getCarMaintenanceStatus(carId: string) {
    // 1. Get Car + Current Mileage + Model ID
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: { model: true },
    });
    if (!car) throw new NotFoundException('Car not found');

    // 2. Get "DNA" (Rules) for this Model
    const rules = await this.repository.findRulesByModel(car.modelId);

    // 3. Compute Status for each rule
    const report = rules.map((rule) => {
      if (!rule.intervalKm) return null; // Skip non-mileage rules for now

      const interval = rule.intervalKm;
      const mileage = car.mileageKm;

      // Logic: If I am at 25,000km and interval is 10,000km...
      // Last service should have been at 20,000. Next is 30,000.
      const nextDueKm = Math.ceil((mileage + 1) / interval) * interval;
      const remainingKm = nextDueKm - mileage;

      // Alert Logic
      let status = 'OK';
      if (remainingKm < 0) status = 'OVERDUE'; // Should not happen with this math, but safe to have
      else if (remainingKm < 1000) status = 'DUE_SOON'; // Warning threshold

      return {
        serviceName: rule.service.name,
        category: rule.service.category,
        interval: interval,
        lastDueAt: nextDueKm - interval,
        nextDueAt: nextDueKm,
        remainingKm: remainingKm,
        status: status,
      };
    });

    return report.filter((r) => r !== null);
  }
}