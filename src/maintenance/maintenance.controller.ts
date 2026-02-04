import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; // Assuming you have this
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // 1. Admin creates "DNA" (Rules)
  // Only Admins or Managers should define rules
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN) 
  @Post('rules')
  createRule(@Body() dto: CreateMaintenanceRuleDto) {
    return this.maintenanceService.createRule(dto);
  }

  // 2. Get Rules for a specific Model (e.g. "What is the schedule for a Corolla?")
  @Get('rules/model/:modelId')
  getRulesByModel(@Param('modelId') modelId: string) {
    return this.maintenanceService.getRulesForModel(modelId);
  }

  // 3. THE SMART ENDPOINT: Get Status for MY Car
  @Get('status/:carId')
  getCarStatus(@Param('carId') carId: string) {
    return this.maintenanceService.getCarMaintenanceStatus(carId);
  }
}