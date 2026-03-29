import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartResponseDto } from './dto/part-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Add a new part to inventory' })
  @ApiResponse({ status: 201, description: 'Part created' })
  async create(@Body() dto: CreatePartDto) {
    const part = await this.inventoryService.create(dto);
    return new PartResponseDto(part);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'List parts with pagination and search' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    const parts = await this.inventoryService.findAll(pagination, search);
    return parts.map((part) => new PartResponseDto(part));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Get part details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const part = await this.inventoryService.findOne(id);
    return new PartResponseDto(part);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Update part details' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartDto,
  ) {
    const part = await this.inventoryService.update(id, dto);
    return new PartResponseDto(part);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a part (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.remove(id);
  }
}
