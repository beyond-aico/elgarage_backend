import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  createBrand(dto: CreateBrandDto) {
    return this.prisma.carBrand.create({
      data: { name: dto.name },
    });
  }

  createModel(dto: CreateModelDto) {
    return this.prisma.carModel.create({
      data: {
        name: dto.name,
        brandId: dto.brandId,
      },
    });
  }

  listBrands() {
    return this.prisma.carBrand.findMany({
      include: { models: true },
    });
  }
}
