import { User, UserRole } from '@prisma/client';
import { SignupDto } from '../../auth/dto/auth.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  UpdateOwnProfileDto,
  AdminUpdateUserDto,
} from '../dto/update-user.dto';

export const USERS_REPOSITORY = 'USERS_REPOSITORY';
export type SafeUser = Omit<User, 'password'>;

export interface IUsersRepository {
  createNormalUser(dto: SignupDto, hash: string): Promise<SafeUser>;
  createCorporateUserWithOrg(dto: SignupDto, hash: string): Promise<SafeUser>;
  /**
   * resolvedOrgId is pre-resolved by UsersService from caller context.
   * The repository never reads organizationId from dto directly.
   */
  adminCreateUser(
    dto: CreateUserDto,
    hash: string,
    resolvedOrgId: string | null,
  ): Promise<SafeUser>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  findById(id: string): Promise<SafeUser | null>;
  findByIdWithPassword(id: string): Promise<User | null>;
  findAll(role?: UserRole): Promise<SafeUser[]>;
  updateProfile(id: string, dto: UpdateOwnProfileDto): Promise<SafeUser>;
  adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<SafeUser>;
  updatePassword(id: string, hash: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
