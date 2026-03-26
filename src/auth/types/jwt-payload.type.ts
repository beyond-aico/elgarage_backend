export interface JwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
  organizationId?: string | null;
}

export interface RefreshJwtPayload {
  sub: string;
}
