import { Controller, Get, Query, UseGuards, Param, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminReportsService } from './admin-reports.service';
import { GetReportDto } from './dto/get-report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetAnalyticsFilterDto } from '../../fleet/dto/get-analytics-filter.dto';
import { AuthUser } from '../../auth/types/auth-user.type';
import { ParseUUIDPipe } from '@nestjs/common';

type AuthRequest = Request & { user: AuthUser };

@ApiTags('Admin Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get high-level dashboard statistics (Admin only)' })
  async getDashboard(@Query() dto: GetReportDto) {
    return this.reportsService.getDashboardStats(dto);
  }

  @Get('inventory-alerts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get list of parts with low stock (Admin only)' })
  async getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('popular-services')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get top 5 most ordered services (Admin only)' })
  async getPopularServices() {
    return this.reportsService.getPopularServices();
  }

  @Get('fleet/dashboard')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Get fleet KPIs — scoped to caller's org for Account Managers",
  })
  async getFleetDashboard(
    @Req() req: AuthRequest,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.reportsService.getFleetDashboard(filter, req.user);
  }

  @Get('fleet/vehicle-analysis/:carId')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get TCO for a specific vehicle — org-ownership validated for Account Managers',
  })
  async getVehicleAnalysis(
    @Req() req: AuthRequest,
    @Param('carId', ParseUUIDPipe) carId: string,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.reportsService.getVehicleAnalysis(carId, filter, req.user);
  }

  @Get('fleet/driver-analysis/:driverId')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Analyze driver efficiency — org-ownership validated for Account Managers',
  })
  async getDriverAnalysis(
    @Req() req: AuthRequest,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.reportsService.getDriverAnalysis(driverId, filter, req.user);
  }
}
