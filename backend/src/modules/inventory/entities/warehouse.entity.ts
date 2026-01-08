import { Exclude } from 'class-transformer';

export class WarehouseEntity {
  id!: string;
  name!: string;
  location?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
