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
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

type AuthenticatedRequest = Request & {
  user: { userId: string; role: UserRole };
};

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user, createOrderDto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ) {
    const { userId, role } = req.user;
    return this.ordersService.findAll(pagination, userId, role);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { userId, role } = req.user;
    return this.ordersService.findOne(id, userId, role);
  }
}
