import { Body, Controller, Get, Post, UseGuards,Query } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles('ADMIN') // الإضافة للأدمن فقط
  createBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.createBrand(dto);
  }

  @Post('models')
  @Roles('ADMIN') // إضافة الموديلات للأدمن فقط
  createModel(@Body() dto: CreateModelDto) {
    return this.brandsService.createModel(dto);
  }

 @Get()
  @Roles('ADMIN', 'USER', 'ACCOUNT_MANAGER')
  listBrands() {
    return this.brandsService.listBrands();
  }

  // 2. مسار جلب الموديلات لبراند معين (GET /admin/brands/models)
  @Get('models')
  @Roles('ADMIN', 'USER', 'ACCOUNT_MANAGER')
  // نستخدم @Query لسحب brandId من الرابط
  listModels(@Query('brandId') brandId: string) {
    return this.brandsService.listModels(brandId);
  }
}
