import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { MAINTENANCE_REPOSITORY } from './interfaces/maintenance.repository.interface';
import type { IMaintenanceRepository } from './interfaces/maintenance.repository.interface';
import { CarsService } from '../cars/cars.service';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from './dto/record-maintenance.dto';
import dayjs from 'dayjs';

@Injectable()
export class MaintenanceService {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    private readonly carsService: CarsService,
  ) {}

  // --- Admin: Rules Management ---
  async createRule(dto: CreateMaintenanceRuleDto) {
    const existing = await this.maintenanceRepository.findRuleByServiceId(dto.serviceId);
    if (existing) {
      throw new ConflictException(
        'A maintenance rule for this service already exists',
      );
    }
    return this.maintenanceRepository.createRule(dto);
  }

  async getAllRules() {
    return this.maintenanceRepository.findAllRules();
  }

  // --- User: Records & Calculation ---
  async recordMaintenance(
    userId: string,
    carId: string,
    dto: RecordMaintenanceDto,
  ) {
    // 1. Verify Car Ownership
    const car = await this.carsService.findOne(carId, userId);

    // 2. Update Car Mileage if the new record is higher
    if (dto.mileageKm > car.mileageKm) {
      // We'd ideally call carsService.updateMileage(carId, dto.mileageKm)
      // allowing auto-update of car state
    }

    return this.maintenanceRepository.createRecord(carId, dto);
  }

  async getHistory(userId: string, carId: string) {
    await this.carsService.findOne(carId, userId);
    return this.maintenanceRepository.findRecordsByCarId(carId);
  }

  async checkDueServices(userId: string, carId: string) {
    const car = await this.carsService.findOne(carId, userId);
    const rules = await this.maintenanceRepository.findAllRules();
    const dueServices = [];

    for (const rule of rules) {
      const lastRecord = await this.maintenanceRepository.findLastRecord(
        carId,
        rule.serviceId,
      );

      let isDue = false;
      let reason = '';

      if (!lastRecord) {
        isDue = true;
        reason = 'Never performed';
      } else {
        // Check Mileage
        if (rule.intervalKm) {
          const kmSince = car.mileageKm - lastRecord.mileageKm;
          if (kmSince >= rule.intervalKm) {
            isDue = true;
            reason = `Overdue by ${kmSince - rule.intervalKm} km`;
          }
        }

        // Check Time (if not already due by mileage)
        if (!isDue && rule.intervalMonths) {
          const monthsSince = dayjs().diff(
            dayjs(lastRecord.performedAt),
            'month',
          );
          if (monthsSince >= rule.intervalMonths) {
            isDue = true;
            reason = `Overdue by time (${monthsSince} months)`;
          }
        }
      }

      if (isDue) {
        dueServices.push({
          service: rule.service,
          reason,
          nextDueKm: lastRecord
            ? lastRecord.mileageKm + (rule.intervalKm || 0)
            : car.mileageKm,
          nextDueDate:
            lastRecord && rule.intervalMonths
              ? dayjs(lastRecord.performedAt)
                  .add(rule.intervalMonths, 'month')
                  .toDate()
              : new Date(),
        });
      }
    }

    return dueServices;
  }
}
