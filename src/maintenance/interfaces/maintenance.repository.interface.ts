import { MaintenanceRecord, MaintenanceRule, Service } from '@prisma/client';
import { CreateMaintenanceRuleDto } from '../dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from '../dto/record-maintenance.dto';

export const MAINTENANCE_REPOSITORY = 'MAINTENANCE_REPOSITORY';
export type MaintenanceRuleWithService = MaintenanceRule & { service: Service };

export interface IMaintenanceRepository {
  // Rules
  createRule(data: CreateMaintenanceRuleDto): Promise<MaintenanceRule>;
  findAllRules(): Promise<MaintenanceRuleWithService[]>;
  findRuleByServiceId(serviceId: string): Promise<MaintenanceRule | null>;
  // Records
  createRecord(
    carId: string,
    data: RecordMaintenanceDto,
  ): Promise<MaintenanceRecord>;
  findRecordsByCarId(carId: string): Promise<MaintenanceRecord[]>;
  findLastRecord(
    carId: string,
    serviceId: string,
  ): Promise<MaintenanceRecord | null>;
}
