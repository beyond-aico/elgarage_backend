import { Injectable } from '@nestjs/common';
import {
  IUsersRepository,
  SafeUser,
} from '../interfaces/users.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { SignupDto } from '../../auth/dto/auth.dto';
import {
  UpdateOwnProfileDto,
  AdminUpdateUserDto,
} from '../dto/update-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  address: true,
  city: true,
  country: true,
  role: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class UsersPrismaRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createNormalUser(dto: SignupDto, hash: string): Promise<SafeUser> {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        phone: dto.phone ?? null,
        role: UserRole.USER,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async createCorporateUserWithOrg(
    dto: SignupDto,
    hash: string,
  ): Promise<SafeUser> {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.organizationName!, taxId: dto.taxId ?? null },
      });
      return tx.user.create({
        data: {
          email: dto.email,
          password: hash,
          name: dto.name,
          phone: dto.phone ?? null,
          role: UserRole.ACCOUNT_MANAGER,
          organizationId: org.id,
        },
        select: SAFE_USER_SELECT,
      });
    });
  }

  /**
   * resolvedOrgId is pre-resolved by UsersService from the caller's JWT.
   * The repository never reads organizationId from dto — it only writes
   * what the service has already validated and resolved.
   * The write is atomic inside the single prisma.user.create() call.
   */
  async adminCreateUser(
    dto: CreateUserDto,
    hash: string,
    resolvedOrgId: string | null,
  ): Promise<SafeUser> {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        role: dto.role ?? UserRole.USER,
        organizationId: resolvedOrgId,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { organization: true },
    });
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: SAFE_USER_SELECT,
    });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findAll(role?: UserRole): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      where: role ? { role, deletedAt: null } : { deletedAt: null },
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProfile(id: string, dto: UpdateOwnProfileDto): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async updatePassword(id: string, hash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hash },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
  }
}
