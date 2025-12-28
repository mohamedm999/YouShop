import { UserEntity } from '../../modules/auth/entities/user.entity';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
}
