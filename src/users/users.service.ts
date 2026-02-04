// src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignupDto } from '../auth/dto/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto'; // Make sure this is imported

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: SignupDto): Promise<User> {
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

  private async createNormalUser(dto: SignupDto, hash: string) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        // FIX: Convert undefined to null
        phone: dto.phone ?? null, 
        role: UserRole.USER,
      },
    });
  }

  private async createCorporateUser(dto: SignupDto, hash: string) {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName!,
          // FIX: Convert undefined to null
          taxId: dto.taxId ?? null, 
        },
      });

      return tx.user.create({
        data: {
          email: dto.email,
          password: hash,
          name: dto.name,
          // FIX: Convert undefined to null
          phone: dto.phone ?? null,
          role: UserRole.ACCOUNT_MANAGER,
          organizationId: org.id,
        },
      });
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findAll(role?: UserRole) {
    if (role) {
      return this.prisma.user.findMany({ where: { role } });
    }
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.findById(id);
  }

async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}