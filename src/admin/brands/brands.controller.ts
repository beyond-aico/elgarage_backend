import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Admin — Brands')
@ApiBearerAuth()
@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a car brand (Admin only)' })
  createBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.createBrand(dto);
  }

  @Post('models')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a car model (Admin only)' })
  createModel(@Body() dto: CreateModelDto) {
    return this.brandsService.createModel(dto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.USER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.DRIVER,
  )
  @ApiOperation({ summary: 'List all brands with their models' })
  listBrands() {
    return this.brandsService.listBrands();
  }

  @Get('models')
  @Roles(
    UserRole.ADMIN,
    UserRole.USER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.DRIVER,
  )
  @ApiOperation({ summary: 'List models for a given brand' })
  listModels(@Query('brandId') brandId: string) {
    return this.brandsService.listModels(brandId);
  }
}
