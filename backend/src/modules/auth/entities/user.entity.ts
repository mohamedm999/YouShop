import { Exclude } from 'class-transformer';
import { Role } from '../generated/prisma';

export class UserEntity {
  id!: string;
  email!: string;
  firstName!: string | null;
  lastName!: string | null;
  role!: Role;

  @Exclude()
  password!: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
