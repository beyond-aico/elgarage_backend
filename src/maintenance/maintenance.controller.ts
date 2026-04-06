import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRuleDto } from './dto/create-maintenance-rule.dto';
import { RecordMaintenanceDto } from './dto/record-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // ─── Rules ───────────────────────────────────────────────────────────────

  @Post('rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a maintenance rule (Admin only)' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  @ApiResponse({
    status: 409,
    description: 'Rule already exists for this model/service',
  })
  createRule(@Body() dto: CreateMaintenanceRuleDto) {
    return this.maintenanceService.createRule(dto);
  }

  @Get('rules/model/:modelId')
  @ApiParam({ name: 'modelId', description: 'UUID of the car model' })
  @ApiOperation({ summary: 'Get all maintenance rules for a car model' })
  getRulesByModel(@Param('modelId', ParseUUIDPipe) modelId: string) {
    return this.maintenanceService.getRulesForModel(modelId);
  }

  // ─── Records ─────────────────────────────────────────────────────────────

  @Post('records/:carId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiParam({ name: 'carId', description: 'UUID of the car' })
  @ApiOperation({
    summary: 'Record a completed maintenance service (Admin / Account Manager)',
    description:
      'Creates a maintenance record and updates car.mileageKm if the record mileage is higher.',
  })
  @ApiResponse({ status: 201, description: 'Maintenance record created' })
  @ApiResponse({ status: 403, description: 'No access to this vehicle' })
  @ApiResponse({ status: 404, description: 'Car not found' })
  recordMaintenance(
    @Req() req: Request & { user: AuthUser },
    @Param('carId', ParseUUIDPipe) carId: string,
    @Body() dto: RecordMaintenanceDto,
  ) {
    return this.maintenanceService.recordMaintenance(carId, dto, req.user);
  }

  @Get('records/:carId')
  @ApiParam({ name: 'carId', description: 'UUID of the car' })
  @ApiOperation({ summary: 'Get paginated maintenance history for a car' })
  getMaintenanceHistory(
    @Req() req: Request & { user: AuthUser },
    @Param('carId', ParseUUIDPipe) carId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.maintenanceService.getMaintenanceHistory(
      carId,
      req.user,
      pagination,
    );
  }

  // ─── Health Status ────────────────────────────────────────────────────────

  @Get('status/:carId')
  @ApiParam({ name: 'carId', description: 'UUID of the car' })
  @ApiOperation({ summary: 'Get maintenance health status for a car' })
  getCarStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('carId', ParseUUIDPipe) carId: string,
  ) {
    return this.maintenanceService.getCarMaintenanceStatus(carId, req.user);
  }
}
