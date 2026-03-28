import { Injectable, ConflictException } from '@nestjs/common';
import { MaintenanceRepository } from './repositories/maintenance.prisma.repository';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { CarsService } from '../cars/cars.service';
import { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly repository: MaintenanceRepository,
    private readonly carsService: CarsService,
  ) {}

  // --- ADMIN: Manage DNA ---
  async createRule(dto: CreateMaintenanceRuleDto) {
    const existing = await this.repository.findOneRule(
      dto.serviceId,
      dto.modelId,
    );
    if (existing) {
      throw new ConflictException(
        'Rule already exists for this car model and service.',
      );
    }
    return this.repository.createRule(dto);
  }

  async getRulesForModel(modelId: string) {
    return this.repository.findRulesByModel(modelId);
  }

  // --- CORE FEATURE: Calculate Car Health ---
  async getCarMaintenanceStatus(carId: string, userContext: AuthUser) {
    // Reuse CarsService access control to enforce car ownership / visibility.
    const car = await this.carsService.findOne(carId, userContext);

    // Get "DNA" (Rules) for this Model
    const rules = await this.repository.findRulesByModel(car.modelId);

    // Compute status for each rule
    const report = rules.map((rule) => {
      if (!rule.intervalKm) return null; // Skip non-mileage rules for now

      const interval = rule.intervalKm;
      const mileage = car.mileageKm;

      // If at 25,000 km with 10,000 km interval:
      // Last service was at 20,000. Next is at 30,000.
      const nextDueKm = Math.ceil((mileage + 1) / interval) * interval;
      const remainingKm = nextDueKm - mileage;

      let status = 'OK';
      if (remainingKm < 0) status = 'OVERDUE';
      else if (remainingKm < 1000) status = 'DUE_SOON';

      return {
        serviceName: rule.service.name,
        category: rule.service.category,
        interval,
        lastDueAt: nextDueKm - interval,
        nextDueAt: nextDueKm,
        remainingKm,
        status,
      };
    });

    return report.filter((r) => r !== null);
  }
}
