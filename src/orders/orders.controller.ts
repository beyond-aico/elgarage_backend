import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request as Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../auth/types/auth-user.type';

type AuthRequest = Request & { user: AuthUser };

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order for a vehicle' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders (scoped by role)' })
  findAll(@Req() req: AuthRequest, @Query() pagination: PaginationDto) {
    const { userId, role } = req.user;
    return this.ordersService.findAll(pagination, userId, role, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { userId, role } = req.user;
    return this.ordersService.findOne(id, userId, role);
  }

  // ── User-initiated cancellation ─────────────────────────────────────────
  // Separate endpoint so regular users can cancel their own orders without
  // needing ADMIN or ACCOUNT_MANAGER role.
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel an order (owner, Account Manager, or Admin)',
    description:
      'A user can cancel their own PENDING or CONFIRMED order. ' +
      'ADMIN and ACCOUNT_MANAGER can cancel any order in their scope.',
  })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancelOrder(id, req.user);
  }

  // ── Admin / Account Manager status advancement ──────────────────────────
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({
    summary: 'Update order status (Admin / Account Manager only)',
    description:
      'Valid transitions: PENDING→CONFIRMED|CANCELLED, CONFIRMED→IN_PROGRESS|CANCELLED, ' +
      'IN_PROGRESS→COMPLETED. COMPLETED and CANCELLED are terminal. ' +
      'Cancellation automatically reverses stock.',
  })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, req.user);
  }
}
