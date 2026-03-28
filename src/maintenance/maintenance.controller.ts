import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  /** Admin creates a maintenance rule ("DNA") for a car model + service pair. */
  @Post('rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a maintenance rule (Admin only)' })
  createRule(@Body() dto: CreateMaintenanceRuleDto) {
    return this.maintenanceService.createRule(dto);
  }

  /** List all maintenance rules for a specific car model. */
  @Get('rules/model/:modelId')
  @ApiOperation({ summary: 'Get maintenance rules for a car model' })
  getRulesByModel(@Param('modelId') modelId: string) {
    return this.maintenanceService.getRulesForModel(modelId);
  }

  /**
   * Get the health status (due / overdue / OK) for a specific car.
   * Access: personal owner, org fleet member, ADMIN. Everyone else → 403.
   */
  @Get('status/:carId')
  @ApiOperation({ summary: 'Get maintenance health status for a car' })
  getCarStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('carId') carId: string,
  ) {
    return this.maintenanceService.getCarMaintenanceStatus(carId, req.user);
  }
}
