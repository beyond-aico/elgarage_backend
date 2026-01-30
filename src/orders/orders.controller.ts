import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully placed.' })
  async create(
    @Req() req: Request & { user: AuthUser },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const order = await this.ordersService.create(
      req.user.userId,
      createOrderDto,
    );
    return new OrderResponseDto(order);
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  async findAll(
    @Req() req: Request & { user: AuthUser },
    @Query() pagination: PaginationDto,
  ) {
    const orders = await this.ordersService.findAll(
      pagination,
      req.user.userId,
      req.user.role,
    );
    return orders.map((o) => new OrderResponseDto(o));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async findOne(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    const order = await this.ordersService.findOne(
      id,
      req.user.userId,
      req.user.role,
    );
    return new OrderResponseDto(order);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(id, dto);
    return new OrderResponseDto(order);
  }
}
