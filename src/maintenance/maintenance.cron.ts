import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 2 * * *') // every day at 2 AM
  async scanAllCars() {
    const cars = await this.prisma.car.findMany();
    console.log(`Scanning ${cars.length} cars for maintenance`);
  }
}
