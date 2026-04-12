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

  // ── Single record lookup (kept for targeted use outside status checks) ──
  async findLastRecord(
    carId: string,
    serviceId: string,
  ): Promise<MaintenanceRecord | null> {
    return this.prisma.maintenanceRecord.findFirst({
      where: { carId, serviceId },
      orderBy: { performedAt: 'desc' },
    });
  }

  // ── Bulk lookup: one query for ALL services of a car ───────────────────
  //
  // Uses a subquery pattern: for each (carId, serviceId) pair, fetch the
  // record with the highest performedAt. This replaces the previous pattern
  // of calling findLastRecord once per rule inside Promise.all, which fired
  // N parallel SELECT queries for a car with N maintenance rules.
  //
  // The result is a Map<serviceId, MaintenanceRecord> so the service layer
  // can do O(1) lookups per rule without any further DB calls.
  async findLastRecordsForCar(
    carId: string,
  ): Promise<Map<string, MaintenanceRecord>> {
    // Fetch all records for this car ordered by performedAt descending.
    // We then keep only the first (most recent) record per serviceId in JS.
    // This is a single query regardless of how many rules the model has.
    //
    // Alternative: a raw SQL DISTINCT ON (serviceId) query would be slightly
    // more efficient at very large history sizes, but for the expected data
    // volume a single findMany + in-memory dedup is simpler and safe.
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { carId },
      orderBy: { performedAt: 'desc' },
    });

    const lastRecordMap = new Map<string, MaintenanceRecord>();

    for (const record of records) {
      // Because records are ordered desc, the first time we see a serviceId
      // is guaranteed to be its most recent record — skip subsequent ones.
      if (!lastRecordMap.has(record.serviceId)) {
        lastRecordMap.set(record.serviceId, record);
      }
    }

    return lastRecordMap;
  }

  async updateCarMileage(carId: string, mileageKm: number): Promise<void> {
    await this.prisma.car.update({
      where: { id: carId },
      data: { mileageKm },
    });
  }
}
