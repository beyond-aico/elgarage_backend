import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type AppRole = 'USER' | 'ADMIN' | 'ACCOUNT_MANAGER' | 'DRIVER';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
