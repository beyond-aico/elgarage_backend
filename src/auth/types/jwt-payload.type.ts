export interface JwtPayload {
  sub: string;
  role: 'USER' | 'ADMIN';
}

export interface RefreshJwtPayload {
  sub: string;
}
