// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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

  private async generateTokens(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      organizationId: user.organizationId 
    };

    // FIX: Ensure secret is never undefined. 
    // In production, ensure these ENV variables are set!
    const atSecret = process.env.JWT_SECRET || 'super_secret_fallback';
    const rtSecret = process.env.JWT_REFRESH_SECRET || 'super_refresh_secret_fallback';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { 
        expiresIn: '15m', 
        secret: atSecret 
      }),
      this.jwtService.signAsync(payload, { 
        expiresIn: '7d', 
        secret: rtSecret 
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    };
  }
async refresh(userId: string) {
    // Simple refresh logic: verify user exists and issue new tokens
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    
    return this.generateTokens(user);
  }

}