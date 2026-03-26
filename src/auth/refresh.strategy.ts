import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshJwtPayload } from './types/jwt-payload.type';
import { jwtFromBody } from './utils/jwt-from-request';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('FATAL: JWT_REFRESH_SECRET is not defined in the environment.');

    super({
      jwtFromRequest: jwtFromBody('refreshToken'),
      secretOrKey: secret,
    });
  }

  validate(payload: RefreshJwtPayload) {
    return { userId: payload.sub };
  }
}