import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  createBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.createBrand(dto);
  }

  @Post('models')
  createModel(@Body() dto: CreateModelDto) {
    return this.brandsService.createModel(dto);
  }

  @Get()
  list() {
    return this.brandsService.listBrands();
  }
}
