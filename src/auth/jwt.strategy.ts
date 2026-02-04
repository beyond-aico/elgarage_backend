import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // FIX: Match the fallback used in AuthService ('super_secret_fallback')
      secretOrKey: process.env.JWT_SECRET || 'super_secret_fallback',
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role,
      organizationId: payload.organizationId 
    };
  }
}