export interface JwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'ACCOUNT_MANAGER' | 'DRIVER';
  organizationId?: string | null;
}

export interface RefreshJwtPayload {
  sub: string;
}
