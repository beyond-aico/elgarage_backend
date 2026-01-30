import { Expose } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  name!: string;

  @Expose()
  phone!: string | null;

  @Expose()
  address!: string | null;

  @Expose()
  city!: string | null;

  @Expose()
  country!: string | null;

  @Expose()
  role!: UserRole;

  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
