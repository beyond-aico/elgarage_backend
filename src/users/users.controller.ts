import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnProfileDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return new UserResponseDto(user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  async findAll(@Query('role') role?: UserRole) {
    const users = await this.usersService.findAll(role);
    return users.map((u) => new UserResponseDto(u));
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  async getProfile(@Req() req: Request & { user: AuthUser }) {
    const user = await this.usersService.findOne(req.user.userId);
    if (!user) throw new NotFoundException('Profile not found');
    return new UserResponseDto(user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get any user by ID (Admin only)' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return new UserResponseDto(user);
  }

  /**
   * Self-service profile update — accepts only name, phone, address, city, country.
   * Email and role changes are intentionally excluded.
   */
  @Patch('profile')
  @ApiOperation({ summary: 'Update own profile (name, phone, address only)' })
  async updateProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateOwnProfileDto,
  ) {
    const user = await this.usersService.updateProfile(req.user.userId, dto);
    return new UserResponseDto(user);
  }

  /**
   * Admin update — can modify email, role, and all profile fields.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update any user including email/role (Admin only)',
  })
  async update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    const user = await this.usersService.adminUpdate(id, dto);
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
