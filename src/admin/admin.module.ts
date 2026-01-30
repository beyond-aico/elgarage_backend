import { Module } from '@nestjs/common';
import { BrandsModule } from './brands/brands.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [BrandsModule, ReportsModule],
})
export class AdminModule {}
