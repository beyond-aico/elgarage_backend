import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const user = await this.usersService.create(dto);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

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

    // Fail fast if critical environment variables are missing
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

    // Dynamic expiration fetching from .env with safe defaults
    const atExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const rtExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    // FIX: Cast the options objects 'as any' to bypass the strict StringValue type check
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

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async refresh(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateTokens(user);
  }
}
