import { Injectable, ConflictException } from '@nestjs/common';
import { MaintenanceRepository } from './repositories/maintenance.prisma.repository';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from './dto/record-maintenance.dto';
import { CarsService } from '../cars/cars.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly repository: MaintenanceRepository,
    private readonly carsService: CarsService,
  ) {}

  // ─── Rules ───────────────────────────────────────────────────────────────

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

  // ─── Records ─────────────────────────────────────────────────────────────

  async recordMaintenance(
    carId: string,
    dto: RecordMaintenanceDto,
    userContext: AuthUser,
  ) {
    const car = await this.carsService.findOne(carId, userContext);
    const record = await this.repository.createRecord(carId, dto);

    if (dto.mileageKm > car.mileageKm) {
      await this.repository.updateCarMileage(carId, dto.mileageKm);
    }

    return record;
  }

  async getMaintenanceHistory(
    carId: string,
    userContext: AuthUser,
    pagination?: PaginationDto,
  ) {
    await this.carsService.findOne(carId, userContext);
    return this.repository.findRecordsByCarId(carId, pagination);
  }

  // ─── Health Status ───────────────────────────────────────────────────────

  async getCarMaintenanceStatus(carId: string, userContext: AuthUser) {
    const car = await this.carsService.findOne(carId, userContext);
    const rules = await this.repository.findRulesByModel(car.modelId);

    // was Promise.all(rules.map(() => findLastRecord(carId, serviceId)))
    // which fired one SELECT per rule. Now we issue a single bulk query and
    // resolve each rule from an in-memory map — O(1) per rule, 1 DB call total
    // regardless of how many rules the model has.
    const lastRecordMap = await this.repository.findLastRecordsForCar(carId);

    const report = rules.map((rule) => {
      // ── Mileage-based rule ─────────────────────────────────────────────
      if (rule.intervalKm) {
        const lastRecord = lastRecordMap.get(rule.serviceId) ?? null;

        if (!lastRecord) {
          return {
            serviceName: rule.service.name,
            category: rule.service.category,
            intervalKm: rule.intervalKm,
            lastPerformedAtKm: null,
            nextDueAtKm: rule.intervalKm,
            remainingKm: rule.intervalKm - car.mileageKm,
            status:
              car.mileageKm >= rule.intervalKm
                ? 'OVERDUE'
                : 'PENDING_FIRST_SERVICE',
            lastPerformedAt: null,
          };
        }

        const nextDueKm = lastRecord.mileageKm + rule.intervalKm;
        const remainingKm = nextDueKm - car.mileageKm;
        let status = 'OK';
        if (remainingKm <= 0) status = 'OVERDUE';
        else if (remainingKm < 1000) status = 'DUE_SOON';

        return {
          serviceName: rule.service.name,
          category: rule.service.category,
          intervalKm: rule.intervalKm,
          lastPerformedAtKm: lastRecord.mileageKm,
          nextDueAtKm: nextDueKm,
          remainingKm,
          status,
          lastPerformedAt: lastRecord.performedAt,
        };
      }

      // ── Month-based rule ───────────────────────────────────────────────
      if (rule.intervalMonths) {
        const lastRecord = lastRecordMap.get(rule.serviceId) ?? null;

        if (!lastRecord) {
          return {
            serviceName: rule.service.name,
            category: rule.service.category,
            intervalMonths: rule.intervalMonths,
            nextDueAt: null,
            status: 'PENDING_FIRST_SERVICE',
            lastPerformedAt: null,
          };
        }

        const nextDue = new Date(lastRecord.performedAt);
        nextDue.setMonth(nextDue.getMonth() + rule.intervalMonths);
        const now = new Date();
        const daysRemaining = Math.ceil(
          (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let status = 'OK';
        if (daysRemaining <= 0) status = 'OVERDUE';
        else if (daysRemaining <= 14) status = 'DUE_SOON';

        return {
          serviceName: rule.service.name,
          category: rule.service.category,
          intervalMonths: rule.intervalMonths,
          nextDueAt: nextDue,
          daysRemaining,
          status,
          lastPerformedAt: lastRecord.performedAt,
        };
      }

      return null;
    });

    return report.filter((r) => r !== null);
  }
}
