import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { RefreshJwtPayload } from './types/jwt-payload.type';
import { jwtFromBody } from './utils/jwt-from-request';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: jwtFromBody('refreshToken'),
      secretOrKey: process.env.JWT_REFRESH_SECRET as string,
    });
  }

  validate(payload: RefreshJwtPayload) {
    return { userId: payload.sub };
  }
}
