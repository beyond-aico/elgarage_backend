import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

/** Parse a simple duration string like "15m", "7d", "24h" into milliseconds. */
function parseDurationMs(value: string): number {
  const unit = value.slice(-1);
  const amount = parseInt(value.slice(0, -1), 10);
  if (isNaN(amount)) throw new Error(`Invalid duration: ${value}`);
  switch (unit) {
    case 's':
      return amount * 1_000;
    case 'm':
      return amount * 60 * 1_000;
    case 'h':
      return amount * 60 * 60 * 1_000;
    case 'd':
      return amount * 24 * 60 * 60 * 1_000;
    default:
      throw new Error(`Unsupported duration unit "${unit}" in: ${value}`);
  }
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async signup(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async refresh(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    // Token string match + expiry were already validated in RefreshStrategy.validate().
    // If we reach here the token is genuine — issue a new pair (rotation).
    return this.generateTokens(user);
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    organizationId?: string | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const atSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!atSecret)
      throw new Error(
        'FATAL: JWT_ACCESS_SECRET is not defined in the environment.',
      );

    const rtSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!rtSecret)
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET is not defined in the environment.',
      );

    const atExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const rtExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: atExpiresIn,
        secret: atSecret,
      } as any),
      this.jwtService.signAsync(payload, {
        expiresIn: rtExpiresIn,
        secret: rtSecret,
      } as any),
    ]);

    // Hash before storing — raw token stays with the client only,
    // DB compromise does not yield usable tokens
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + parseDurationMs(rtExpiresIn));

    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: { token: tokenHash, expiresAt },
      create: { userId: user.id, token: tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken, // raw token returned to client — never stored
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
