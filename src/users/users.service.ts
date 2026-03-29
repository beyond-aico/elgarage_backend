import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignupDto } from '../auth/dto/auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnProfileDto, AdminUpdateUserDto } from './dto/update-user.dto';
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

  // ─── ADMIN FLOW (Called by UsersController) ─────────────────────────────

  /**
   * Admin creation flow. Allows setting explicit roles and profile data
   * right at the point of creation.
   */
  async create(dto: CreateUserDto): Promise<SafeUser> {
    await this.checkEmailUniqueness(dto.email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepo.adminCreateUser(dto, hashedPassword);
  }

  // ─── PUBLIC REGISTRATION FLOW (Called by AuthService) ───────────────────

  /**
   * Public registration flow. Handles standard user creation as well as
   * B2B organization creation if corporate fields are provided.
   */
  async registerPublicUser(dto: SignupDto): Promise<SafeUser> {
    await this.checkEmailUniqueness(dto.email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    if (dto.organizationName) {
      return this.usersRepo.createCorporateUserWithOrg(dto, hashedPassword);
    } else {
      return this.usersRepo.createNormalUser(dto, hashedPassword);
    }
  }

  // ─── DATA RETRIEVAL ──────────────────────────────────────────────────────

  /**
   * Used ONLY by AuthService for login — must include password for bcrypt.compare.
   * Never expose the return value of this method directly to a controller response.
   */
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

  // ─── UPDATES & DELETION ──────────────────────────────────────────────────

  /** Self-service profile update — non-sensitive fields only. */
  async updateProfile(id: string, dto: UpdateOwnProfileDto): Promise<SafeUser> {
    return this.usersRepo.updateProfile(id, dto);
  }

  /** Admin-only update — can change email, role, and all profile fields. */
  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUser> {
    return this.usersRepo.adminUpdate(id, dto);
  }

  /** Soft-delete: stamps deletedAt, keeps the row for referential integrity. */
  async remove(id: string): Promise<void> {
    await this.usersRepo.softDelete(id);
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private async checkEmailUniqueness(email: string): Promise<void> {
    const existingUser = await this.usersRepo.findByEmailWithPassword(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
  }
}
