export interface AuthUser {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'ACCOUNT_MANAGER' | 'DRIVER';
  organizationId?: string | null;
}
