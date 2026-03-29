import {
  Injectable,
  ConflictException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignupDto } from '../auth/dto/auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnProfileDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  IUsersRepository,
  USERS_REPOSITORY,
  SafeUser,
} from './interfaces/users.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    await this.checkEmailUniqueness(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepo.adminCreateUser(dto, hashedPassword);
  }

  async registerPublicUser(dto: SignupDto): Promise<SafeUser> {
    await this.checkEmailUniqueness(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    if (dto.organizationName) {
      return this.usersRepo.createCorporateUserWithOrg(dto, hashedPassword);
    }
    return this.usersRepo.createNormalUser(dto, hashedPassword);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo.findByEmailWithPassword(email);
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.usersRepo.findById(id);
  }

  async findOne(id: string): Promise<SafeUser | null> {
    return this.usersRepo.findById(id);
  }

  async findAll(role?: UserRole): Promise<SafeUser[]> {
    return this.usersRepo.findAll(role);
  }

  async updateProfile(id: string, dto: UpdateOwnProfileDto): Promise<SafeUser> {
    return this.usersRepo.updateProfile(id, dto);
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUser> {
    return this.usersRepo.adminUpdate(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepo.softDelete(id);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Fetch the full user (including password) for verification
    const user = await this.usersRepo.findByIdWithPassword(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.updatePassword(userId, newHash);

    return { message: 'Password changed successfully' };
  }

  private async checkEmailUniqueness(email: string): Promise<void> {
    const existing = await this.usersRepo.findByEmailWithPassword(email);
    if (existing) throw new ConflictException('Email already in use');
  }
}
