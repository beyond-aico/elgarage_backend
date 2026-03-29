import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { FleetService } from './fleet.service';
import { AuthBarcodeDto } from './dto/auth-barcode.dto';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '@prisma/client';
import { GetAnalyticsFilterDto } from './dto/get-analytics-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../auth/types/auth-user.type';

type AuthRequest = Request & { user: AuthUser };

@ApiTags('Fleet')
@ApiBearerAuth()
@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  // ── DRIVER ENDPOINTS ──────────────────────────────────────────────────────

  @Post('auth-barcode')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Authenticate fleet vehicle by barcode',
    description: 'Driver scans vehicle barcode to unlock vehicle session',
  })
  async authBarcode(@Body() dto: AuthBarcodeDto) {
    return this.fleetService.authenticateVehicle(dto);
  }

  @Post('logs')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Driver submits fuel log',
    description:
      'Records fuel consumption and odometer reading for a fleet vehicle',
  })
  async addFuelLog(
    @Req() req: AuthRequest,
    @Body() dto: CreateFuelLogDto,
  ): Promise<any> {
    const driverId = req.user.userId;
    return this.fleetService.addFuelLog(driverId, dto);
  }

  // ── MANAGER / ADMIN ENDPOINTS ─────────────────────────────────────────────

  /**
   * Chronological odometer / fuel history for a single fleet vehicle.
   * Exposes the underlying FuelLog event log so managers can audit every
   * recorded fill-up and see how the odometer reading has progressed over time.
   * Car.mileageKm is the denormalised current value; this is the source of truth.
   */
  @Get('logs/:carId/history')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiParam({ name: 'carId', description: 'UUID of the fleet vehicle' })
  @ApiOperation({
    summary: 'Odometer history for a fleet vehicle',
    description:
      'Returns paginated fuel logs ordered oldest-first. ' +
      'Use skip/take for pagination.',
  })
  async getOdometerHistory(
    @Param('carId') carId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.fleetService.getOdometerHistory(carId, pagination);
  }

  @Get('analytics/vehicles')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Fleet fuel cost analytics by vehicle',
    description:
      'Supports optional startDate and endDate query parameters for time-bound filtering.',
  })
  async getVehicleAnalytics(@Query() filter: GetAnalyticsFilterDto) {
    return this.fleetService.getCostByVehicle(filter);
  }

  @Get('analytics/drivers')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Fleet fuel cost analytics by driver',
    description:
      'Supports optional startDate and endDate query parameters for time-bound filtering.',
  })
  async getDriverAnalytics(@Query() filter: GetAnalyticsFilterDto) {
    return this.fleetService.getCostByDriver(filter);
  }
}
