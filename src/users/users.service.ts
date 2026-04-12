import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
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
import { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
  ) {}

  /**
   * Create a user.
   *
   * Authorization rules enforced here (after the role guard has already
   * verified the caller is ADMIN or ACCOUNT_MANAGER):
   *
   *   ACCOUNT_MANAGER:
   *     - May only create DRIVER accounts.
   *     - organizationId is resolved from callerContext.organizationId.
   *     - If callerContext.organizationId is missing, fail explicitly —
   *       this should never happen if the JWT is valid, but we guard it.
   *
   *   ADMIN:
   *     - May create any role except DRIVER.
   *     - organizationId is never injected — ADMIN operates system-wide.
   */
  async create(dto: CreateUserDto, callerContext: AuthUser): Promise<SafeUser> {
    await this.checkEmailUniqueness(dto.email);

    const resolvedOrgId = this.resolveOrganizationId(dto.role, callerContext);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepo.adminCreateUser(dto, hashedPassword, resolvedOrgId);
  }

  private resolveOrganizationId(
    role: UserRole | undefined,
    callerContext: AuthUser,
  ): string | null {
    const callerRole = callerContext.role;

    if (callerRole === UserRole.ACCOUNT_MANAGER) {
      // ACCOUNT_MANAGER may only create drivers for their own org
      if (role !== UserRole.DRIVER) {
        throw new BadRequestException(
          'Account Managers can only create DRIVER accounts.',
        );
      }

      if (!callerContext.organizationId) {
        // Guard against a malformed JWT — should never reach production
        throw new ForbiddenException(
          'Your session has no organization context. Cannot create a driver.',
        );
      }

      return callerContext.organizationId;
    }

    // ADMIN path — no org injection, DRIVER creation not allowed via this route
    if (role === UserRole.DRIVER) {
      throw new BadRequestException(
        'DRIVER accounts must be created by an Account Manager.',
      );
    }

    return null;
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
