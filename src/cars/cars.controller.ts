import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { Request } from 'express';

@ApiTags('Cars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new car' })
  @ApiResponse({ status: 201, description: 'Car successfully registered.' })
  @ApiResponse({
    status: 409,
    description: 'VIN or Plate Number already exists.',
  })
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createCarDto: CreateCarDto,
  ) {
    return this.carsService.create(req.user.userId, createCarDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cars belonging to the current user' })
  findAll(@Req() req: Request & { user: AuthUser }) {
    return this.carsService.findAllMyCars(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific car details' })
  findOne(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.carsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update car details' })
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carsService.update(id, req.user.userId, updateCarDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a car' })
  @ApiResponse({ status: 200, description: 'Car successfully deleted.' })
  remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.carsService.remove(id, req.user.userId);
  }
}
