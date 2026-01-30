import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import this
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { RefreshStrategy } from './refresh.strategy'; // If you have this

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_SECRET');

        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is not defined in configuration');
        }

        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
