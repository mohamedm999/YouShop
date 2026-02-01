import { OrderStatus } from '../generated/prisma';
import { Expose, Transform, Type } from 'class-transformer';
import { OrderItem } from './order-item.entity';

export class Order {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  status!: OrderStatus;

  @Expose()
  @Transform(({ value }) => (value ? Number(value) : null))
  totalAmount!: number;

  @Expose()
  @Type(() => OrderItem)
  items!: OrderItem[];

  @Expose()
  shippingAddr!: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
