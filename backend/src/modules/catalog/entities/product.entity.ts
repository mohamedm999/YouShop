import { Decimal } from '@prisma/client/runtime/library';

export class ProductEntity {
  id!: string;
  sku!: string;
  name!: string;
  description!: string | null;
  price!: Decimal;
  imageUrl!: string | null;
  isActive!: boolean;
  categoryId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }
}
