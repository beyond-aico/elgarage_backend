import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { CACHE_TTL } from '../../config/cache.config';

const CACHE_KEY = {
  BRANDS: 'brands:all',
  MODELS: (brandId: string) => `brands:models:${brandId}`,
} as const;

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async createBrand(dto: CreateBrandDto) {
    const brand = await this.prisma.carBrand.create({
      data: { name: dto.name },
    });

    // Invalidate the brands list so the next read reflects the new entry.
    await this.cache.del(CACHE_KEY.BRANDS);

    return brand;
  }

  async createModel(dto: CreateModelDto) {
    const model = await this.prisma.carModel.create({
      data: {
        name: dto.name,
        brandId: dto.brandId,
      },
    });

    // Invalidate both the brand list (includes nested models) and the
    // per-brand model list for this specific brand.
    await Promise.all([
      this.cache.del(CACHE_KEY.BRANDS),
      this.cache.del(CACHE_KEY.MODELS(dto.brandId)),
    ]);

    return model;
  }

  async listBrands() {
    const cached = await this.cache.get(CACHE_KEY.BRANDS);
    if (cached) return cached;

    const brands = await this.prisma.carBrand.findMany({
      include: { models: true },
    });

    await this.cache.set(CACHE_KEY.BRANDS, brands, CACHE_TTL.BRANDS);

    return brands;
  }

  async listModels(brandId: string) {
    const key = CACHE_KEY.MODELS(brandId);
    const cached = await this.cache.get(key);
    if (cached) return cached;

    const models = await this.prisma.carModel.findMany({
      where: { brandId },
    });

    await this.cache.set(key, models, CACHE_TTL.BRANDS);

    return models;
  }
}
