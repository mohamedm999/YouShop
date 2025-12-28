import { UserEntity } from '../entities/user.entity';

export class AuthResponseDto {
  accessToken!: string;
  user!: UserEntity;
}
