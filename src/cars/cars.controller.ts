import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request as Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';

type AuthRequest = Request & { user: AuthUser };

@ApiTags('Cars')
@ApiBearerAuth()
@Controller('cars')
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new personal or fleet vehicle' })
  create(@Req() req: AuthRequest, @Body() dto: CreateCarDto) {
    return this.carsService.create(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicles owned by user or their company' })
  findAll(@Req() req: AuthRequest) {
    return this.carsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific vehicle' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarDto,
  ) {
    return this.carsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a vehicle' })
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.remove(id, req.user);
  }
}
