import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MaintenanceRecord } from '@prisma/client';
import { CreateMaintenanceRuleDto } from '../dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from '../dto/record-maintenance.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Rules ───────────────────────────────────────────────────────────────

  async createRule(data: CreateMaintenanceRuleDto) {
    return this.prisma.maintenanceRule.create({
      data: {
        serviceId: data.serviceId,
        modelId: data.modelId,
        intervalKm: data.intervalKm ?? null,
        intervalMonths: data.intervalMonths ?? null,
      },
    });
  }

  async findRulesByModel(modelId: string) {
    return this.prisma.maintenanceRule.findMany({
      where: { modelId },
      include: { service: true },
    });
  }

  async findOneRule(serviceId: string, modelId: string) {
    return this.prisma.maintenanceRule.findUnique({
      where: { serviceId_modelId: { serviceId, modelId } },
    });
  }

  async removeRule(id: string) {
    return this.prisma.maintenanceRule.delete({ where: { id } });
  }

  // ─── Records ─────────────────────────────────────────────────────────────

  async createRecord(
    carId: string,
    dto: RecordMaintenanceDto,
  ): Promise<MaintenanceRecord> {
    return this.prisma.maintenanceRecord.create({
      data: {
        carId,
        serviceId: dto.serviceId,
        mileageKm: dto.mileageKm,
        notes: dto.notes ?? null,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : new Date(),
      },
      include: { service: true },
    });
  }

  async findRecordsByCarId(
    carId: string,
    pagination?: PaginationDto,
  ): Promise<MaintenanceRecord[]> {
    const { skip = 0, take = 50 } = pagination ?? {};
    return this.prisma.maintenanceRecord.findMany({
      where: { carId },
      include: { service: true },
      orderBy: { performedAt: 'desc' },
      skip,
      take,
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

  async updateCarMileage(carId: string, mileageKm: number): Promise<void> {
    await this.prisma.car.update({
      where: { id: carId },
      data: { mileageKm },
    });
  }
}
