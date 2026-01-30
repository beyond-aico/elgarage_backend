import { Injectable } from '@nestjs/common';
import { IMaintenanceRepository } from '../interfaces/maintenance.repository.interface';
import type { MaintenanceRuleWithService } from '../interfaces/maintenance.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceRuleDto } from '../dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from '../dto/record-maintenance.dto';
import { MaintenanceRecord, MaintenanceRule } from '@prisma/client';

@Injectable()
export class MaintenancePrismaRepository implements IMaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Rules ---
  async createRule(data: CreateMaintenanceRuleDto): Promise<MaintenanceRule> {
    return this.prisma.maintenanceRule.create({ data });
  }

  async findAllRules(): Promise<MaintenanceRuleWithService[]> {
    return this.prisma.maintenanceRule.findMany({
      include: { service: true },
    });
  }

  async findRuleByServiceId(
    serviceId: string,
  ): Promise<MaintenanceRule | null> {
    return this.prisma.maintenanceRule.findUnique({
      where: { serviceId },
    });
  }

  // --- Records ---
  async createRecord(
    carId: string,
    data: RecordMaintenanceDto,
  ): Promise<MaintenanceRecord> {
    return this.prisma.maintenanceRecord.create({
      data: {
        carId,
        serviceId: data.serviceId,
        mileageKm: data.mileageKm,
        notes: data.notes ?? null,
        performedAt: data.performedAt ? new Date(data.performedAt) : new Date(),
      },
    });
  }

  async findRecordsByCarId(carId: string): Promise<MaintenanceRecord[]> {
    return this.prisma.maintenanceRecord.findMany({
      where: { carId },
      include: { service: true },
      orderBy: { performedAt: 'desc' },
    });
  }

  async findLastRecord(
    carId: string,
    serviceId: string,
  ): Promise<MaintenanceRecord | null> {
    return this.prisma.maintenanceRecord.findFirst({
      where: { carId, serviceId },
      orderBy: { performedAt: 'desc' },
    });
  }
}
