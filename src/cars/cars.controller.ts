import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request as Req, // Simple alias to avoid name clashes
} from '@nestjs/common';
import type { Request } from 'express'; // <--- Use 'import type' here
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cars')
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  create(@Req() req: Request, @Body() createCarDto: CreateCarDto) {
    return this.carsService.create(req.user, createCarDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.carsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.carsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carsService.update(id, updateCarDto, req.user);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.carsService.remove(id, req.user);
  }
}