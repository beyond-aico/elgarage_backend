import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
  Param,
  ParseUUIDPipe,
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

  @Post('auth-barcode')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Authenticate fleet vehicle by barcode (Driver only)',
  })
  async authBarcode(@Req() req: AuthRequest, @Body() dto: AuthBarcodeDto) {
    return this.fleetService.authenticateVehicle(dto, req.user);
  }

  @Post('logs')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Submit a fuel log (Driver only)' })
  async addFuelLog(
    @Req() req: AuthRequest,
    @Body() dto: CreateFuelLogDto,
  ): Promise<unknown> {
    return this.fleetService.addFuelLog(req.user, dto);
  }

  @Get('logs/:carId/history')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiParam({ name: 'carId', description: 'UUID of the fleet vehicle' })
  @ApiOperation({ summary: 'Paginated odometer history for a fleet vehicle' })
  async getOdometerHistory(
    @Req() req: AuthRequest,
    @Param('carId', ParseUUIDPipe) carId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.fleetService.getOdometerHistory(carId, req.user, pagination);
  }

  @Get('analytics/vehicles')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Fleet fuel cost analytics by vehicle (org-scoped)',
  })
  async getVehicleAnalytics(
    @Req() req: AuthRequest,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.fleetService.getCostByVehicle(req.user, filter);
  }

  @Get('analytics/drivers')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Fleet fuel cost analytics by driver (org-scoped)' })
  async getDriverAnalytics(
    @Req() req: AuthRequest,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.fleetService.getCostByDriver(req.user, filter);
  }
}
