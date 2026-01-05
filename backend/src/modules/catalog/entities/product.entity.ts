import { Decimal } from '@prisma/client/runtime/library';
import { Transform } from 'class-transformer';

export class ProductEntity {
  id!: string;
  sku!: string;
  name!: string;
  description!: string | null;

  @Transform(({ value }) => (value ? Number(value) : null))
  price!: number; // Changed from Decimal to number for API response

  imageUrl!: string | null;
  isActive!: boolean;
  categoryId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }
}
