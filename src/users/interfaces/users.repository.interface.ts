import { User, UserRole } from '@prisma/client';
import { SignupDto } from '../../auth/dto/auth.dto';
import { CreateUserDto } from '../dto/create-user.dto'; // 👈 Import Admin DTO
import {
  UpdateOwnProfileDto,
  AdminUpdateUserDto,
} from '../dto/update-user.dto';

export const USERS_REPOSITORY = 'USERS_REPOSITORY';
export type SafeUser = Omit<User, 'password'>;

export interface IUsersRepository {
  // Public flows
  createNormalUser(dto: SignupDto, hash: string): Promise<SafeUser>;
  createCorporateUserWithOrg(dto: SignupDto, hash: string): Promise<SafeUser>;

  adminCreateUser(dto: CreateUserDto, hash: string): Promise<SafeUser>;

  findByEmailWithPassword(email: string): Promise<User | null>;
  findById(id: string): Promise<SafeUser | null>;
  findAll(role?: UserRole): Promise<SafeUser[]>;
  updateProfile(id: string, dto: UpdateOwnProfileDto): Promise<SafeUser>;
  adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUser>;
  softDelete(id: string): Promise<void>;
}
