import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceRuleDto } from '../dto/create-maintenance-rule.dto';

@Injectable()
export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Find all rules for a specific car model (the "DNA" fetch). */
  async findRulesByModel(modelId: string) {
    return this.prisma.maintenanceRule.findMany({
      where: { modelId },
      include: { service: true },
    });
  }

  /** Find a specific rule by composite key. */
  async findOneRule(serviceId: string, modelId: string) {
    return this.prisma.maintenanceRule.findUnique({
      where: {
        serviceId_modelId: { serviceId, modelId },
      },
    });
  }

  async removeRule(id: string) {
    return this.prisma.maintenanceRule.delete({ where: { id } });
  }
}
