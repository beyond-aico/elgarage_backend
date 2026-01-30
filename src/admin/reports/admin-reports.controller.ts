import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminReportsService } from './admin-reports.service';
import { GetReportDto } from './dto/get-report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

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
}
