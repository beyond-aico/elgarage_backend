import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshJwtPayload } from './types/jwt-payload.type';
import { jwtFromBody } from './utils/jwt-from-request';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret)
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET is not defined in the environment.',
      );

    super({
      jwtFromRequest: jwtFromBody('refreshToken'),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshJwtPayload) {
    const presentedToken = (req.body as { refreshToken?: string })
      ?.refreshToken;

    if (!presentedToken)
      throw new UnauthorizedException('Refresh token missing');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { userId: payload.sub },
    });

    if (!stored)
      throw new UnauthorizedException('Refresh token invalid or revoked');

    // Compare presented raw token against the stored bcrypt hash
    const tokenMatches = await bcrypt.compare(presentedToken, stored.token);
    if (!tokenMatches)
      throw new UnauthorizedException('Refresh token invalid or revoked');

    return { userId: payload.sub };
  }
}
