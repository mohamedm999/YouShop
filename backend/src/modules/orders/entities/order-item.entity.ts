import { Expose, Transform } from 'class-transformer';

export class OrderItem {
  @Expose()
  id!: string;

  @Expose()
  orderId!: string;

  @Expose()
  sku!: string;

  @Expose()
  quantity!: number;

  @Expose()
  @Transform(({ value }) => (value ? Number(value) : null))
  unitPrice!: number;

  @Expose()
  warehouseId!: string;
}
