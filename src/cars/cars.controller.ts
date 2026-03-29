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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type'; // 👈 Import your AuthUser type

// Create a local type alias for a fully typed request
type AuthRequest = Request & { user: AuthUser };

@ApiTags('Cars')
@ApiBearerAuth()
@Controller('cars')
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new personal or fleet vehicle' })
  create(@Req() req: AuthRequest, @Body() createCarDto: CreateCarDto) {
    // req.user is now strictly typed as AuthUser!
    return this.carsService.create(req.user, createCarDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all vehicles owned by the user or their company',
  })
  findAll(@Req() req: AuthRequest) {
    return this.carsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific vehicle' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.carsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carsService.update(id, updateCarDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a vehicle (Soft Delete)' })
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.carsService.remove(id, req.user);
  }
}
