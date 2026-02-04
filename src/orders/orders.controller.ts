import { Controller, Get, Post, Body, Param, UseGuards, Request as Req } from '@nestjs/common';
import type { Request } from 'express'; // Use type-only import
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    // req.user is populated by your JwtAuthGuard
    return this.ordersService.create(req.user, createOrderDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.ordersService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}