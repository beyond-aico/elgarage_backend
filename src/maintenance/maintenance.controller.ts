import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from './dto/record-maintenance.dto';
import { MaintenanceRecordResponseDto } from './dto/maintenance-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // --- Admin Routes ---
  @Post('rules')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Define a maintenance rule (e.g. Oil Change every 5000km)',
  })
  async createRule(@Body() dto: CreateMaintenanceRuleDto) {
    return this.maintenanceService.createRule(dto);
  }

  @Get('rules')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all maintenance rules' })
  async getRules() {
    return this.maintenanceService.getAllRules();
  }

  // --- User Routes ---
  @Post(':carId/record')
  @ApiOperation({ summary: 'Record a performed service' })
  async recordService(
    @Req() req: Request & { user: AuthUser },
    @Param('carId') carId: string,
    @Body() dto: RecordMaintenanceDto,
  ) {
    const record = await this.maintenanceService.recordMaintenance(
      req.user.userId,
      carId,
      dto,
    );
    return new MaintenanceRecordResponseDto(record);
  }

  @Get(':carId/history')
  @ApiOperation({ summary: 'Get service history for a car' })
  async getHistory(
    @Req() req: Request & { user: AuthUser },
    @Param('carId') carId: string,
  ) {
    const records = await this.maintenanceService.getHistory(
      req.user.userId,
      carId,
    );
    return records.map((r) => new MaintenanceRecordResponseDto(r));
  }

  @Get(':carId/due')
  @ApiOperation({ summary: 'Check what services are due for a car' })
  async checkDue(
    @Req() req: Request & { user: AuthUser },
    @Param('carId') carId: string,
  ) {
    return this.maintenanceService.checkDueServices(req.user.userId, carId);
  }
}
