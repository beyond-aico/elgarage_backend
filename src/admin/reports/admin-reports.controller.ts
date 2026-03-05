import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminReportsService } from './admin-reports.service';
import { GetReportDto } from './dto/get-report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetAnalyticsFilterDto } from '../../fleet/dto/get-analytics-filter.dto';

@ApiTags('Admin Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Strict Admin Access
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get high-level dashboard statistics' })
  async getDashboard(@Query() dto: GetReportDto) {
    return this.reportsService.getDashboardStats(dto);
  }

  @Get('inventory-alerts')
  @ApiOperation({ summary: 'Get list of parts with low stock' })
  async getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('popular-services')
  @ApiOperation({ summary: 'Get top 5 most ordered services' })
  async getPopularServices() {
    return this.reportsService.getPopularServices();
  }

  @Get('fleet/dashboard')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get high-level Fleet KPIs (Total Cost, Cost/KM)' })
  async getFleetDashboard(@Query() filter: GetAnalyticsFilterDto) {
    return this.reportsService.getFleetDashboard(filter);
  }

  @Get('fleet/vehicle-analysis/:carId')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get Total Cost of Ownership (Fuel + Maintenance) for a specific vehicle',
  })
  async getVehicleAnalysis(
    @Param('carId') carId: string,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.reportsService.getVehicleAnalysis(carId, filter);
  }

  @Get('fleet/driver-analysis/:driverId')
  @Roles(UserRole.ACCOUNT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Analyze driver efficiency (Liters per 100km)' })
  async getDriverAnalysis(
    @Param('driverId') driverId: string,
    @Query() filter: GetAnalyticsFilterDto,
  ) {
    return this.reportsService.getDriverAnalysis(driverId, filter);
  }
}
