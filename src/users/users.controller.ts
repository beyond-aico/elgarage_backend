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
import { UpdateUserDto } from './dto/update-user.dto';
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
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  async findAll(@Query('role') role?: UserRole) {
    const users = await this.usersService.findAll(role);
    return users.map((user) => new UserResponseDto(user));
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request & { user: AuthUser }) {
    const user = await this.usersService.findOne(req.user.userId);
    return new UserResponseDto(user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get any user details (Admin)' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return new UserResponseDto(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update my profile' })
  async updateProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(req.user.userId, updateUserDto);
    return new UserResponseDto(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update any user (Admin)' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
