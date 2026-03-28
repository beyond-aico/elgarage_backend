import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

import { FleetService } from './fleet.service';
import { AuthBarcodeDto } from './dto/auth-barcode.dto';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '@prisma/client';
import { GetAnalyticsFilterDto } from './dto/get-analytics-filter.dto';
import { AuthUser } from '../auth/types/auth-user.type';

type AuthRequest = Request & { user: AuthUser };

@ApiTags('Fleet')
@ApiBearerAuth()
@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  // DRIVER ENDPOINTS
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

  // MANAGER ENDPOINTS
  @Get('analytics/vehicles')
  @Roles(UserRole.ACCOUNT_MANAGER)
  @ApiOperation({
    summary: 'Fleet fuel cost analytics by vehicle',
    description:
      'Supports optional startDate and endDate query parameters for time-bound filtering.',
  })
  async getVehicleAnalytics(@Query() filter: GetAnalyticsFilterDto) {
    return this.fleetService.getCostByVehicle(filter);
  }

  @Get('analytics/drivers')
  @Roles(UserRole.ACCOUNT_MANAGER)
  @ApiOperation({
    summary: 'Fleet fuel cost analytics by driver',
    description:
      'Supports optional startDate and endDate query parameters for time-bound filtering.',
  })
  async getDriverAnalytics(@Query() filter: GetAnalyticsFilterDto) {
    return this.fleetService.getCostByDriver(filter);
  }
}
