import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from './types/jwt-payload.type';
import { jwtFromAuthorizationHeader } from './utils/jwt-from-request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: jwtFromAuthorizationHeader(),
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
