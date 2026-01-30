import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      ...dto,
      role: UserRole.USER,
    });

    return this.issueTokens(user.id, user.role);
  }

  async login(dto: LoginDto) {
    // 1. Find user
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.role);
  }

  async refresh(userId: string) {
    const user = await this.usersService.findOne(userId);
    return this.issueTokens(user.id, user.role);
  }

  private async issueTokens(userId: string, role?: string) {
    const payload = { sub: userId, role };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: refreshSecret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    await this.prisma.refreshToken.upsert({
      where: { userId },
      update: { token: refreshToken },
      create: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }
}
