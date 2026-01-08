import { Type } from 'class-transformer';
import { WarehouseEntity } from './warehouse.entity';

export class StockEntity {
  id!: string;
  sku!: string;
  quantity!: number;
  reservedQty!: number;
  warehouseId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  @Type(() => WarehouseEntity)
  warehouse?: WarehouseEntity;
}
