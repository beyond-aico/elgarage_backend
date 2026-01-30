import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ServiceCategory } from '@prisma/client';
import { Request } from 'express';
import { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new service (Admin only)' })
  @ApiResponse({ status: 201, description: 'Service created' })
  async create(@Body() createServiceDto: CreateServiceDto) {
    const service = await this.servicesService.create(createServiceDto);
    return new ServiceResponseDto(service);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'List services' })
  @ApiQuery({ name: 'category', enum: ServiceCategory, required: false })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('category') category?: ServiceCategory,
    @Req() req?: Request & { user: AuthUser },
  ) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    const services = await this.servicesService.findAll(
      pagination,
      category,
      isAdmin,
    );
    return services.map((s) => new ServiceResponseDto(s));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get service details' })
  async findOne(@Param('id') id: string) {
    const service = await this.servicesService.findOne(id);
    return new ServiceResponseDto(service);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update service details (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.servicesService.update(id, updateServiceDto);
    return new ServiceResponseDto(service);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a service (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
