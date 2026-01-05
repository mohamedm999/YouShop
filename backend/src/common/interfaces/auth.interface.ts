import { UserEntity } from '../../modules/auth/entities/user.entity';
import { Role } from '../../modules/auth/generated/prisma';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
