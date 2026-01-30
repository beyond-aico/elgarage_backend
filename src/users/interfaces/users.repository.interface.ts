import { User, UserRole } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

export const USERS_REPOSITORY = 'USERS_REPOSITORY';

export interface IUsersRepository {
  create(data: CreateUserDto): Promise<User>;
  findAll(role?: UserRole): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}
