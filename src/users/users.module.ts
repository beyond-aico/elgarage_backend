import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { USERS_REPOSITORY } from './interfaces/users.repository.interface';
import { UsersPrismaRepository } from './repositories/users.prisma.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
