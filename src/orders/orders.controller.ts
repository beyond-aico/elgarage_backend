import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request as Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../auth/types/auth-user.type';

type AuthRequest = Request & {
  user: AuthUser;
};

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order for a vehicle' })
  create(@Req() req: AuthRequest, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders (Filtered by user role)' })
  findAll(@Req() req: AuthRequest, @Query() pagination: PaginationDto) {
    const { userId, role } = req.user;
    return this.ordersService.findAll(pagination, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific order' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const { userId, role } = req.user;
    return this.ordersService.findOne(id, userId, role);
  }
}
