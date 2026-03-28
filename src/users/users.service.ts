import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignupDto } from '../auth/dto/auth.dto';
import { UpdateOwnProfileDto, AdminUpdateUserDto } from './dto/update-user.dto';

/** Fields that are safe to return to any caller. Password is never included. */
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
} as const;

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: SignupDto): Promise<SafeUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    if (dto.organizationName) {
      return this.createCorporateUser(dto, hashedPassword);
    } else {
      return this.createNormalUser(dto, hashedPassword);
    }
  }

  private async createNormalUser(
    dto: SignupDto,
    hash: string,
  ): Promise<SafeUser> {
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

  private async createCorporateUser(dto: SignupDto, hash: string): Promise<SafeUser> {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName!,
          taxId: dto.taxId ?? null,
        },
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
   * Used ONLY by AuthService for login — must include password for bcrypt.compare.
   * Never expose the return value of this method to a controller response.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
  }

  async findAll(role?: UserRole): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<SafeUser | null> {
    return this.findById(id);
  }

  /** Self-service profile update — only non-sensitive fields, no email/role. */
  async updateProfile(id: string, dto: UpdateOwnProfileDto): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  /** Admin-only update — can change email, role, and all profile fields. */
  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
