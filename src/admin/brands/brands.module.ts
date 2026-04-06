import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { AdminFleetController } from '../fleet/fleet.controller';
import { CarsModule } from '../../cars/cars.module';

@Module({
  imports: [CarsModule],
  providers: [BrandsService],
  controllers: [BrandsController, AdminFleetController],
})
export class BrandsModule {}
