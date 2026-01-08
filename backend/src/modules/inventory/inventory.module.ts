import { Module } from '@nestjs/common';
import { InventoryPrismaService } from './prisma/inventory-prisma.service';
import { StockService } from './services/stock.service';
import { WarehouseService } from './services/warehouse.service';
import { StockController } from './controllers/stock.controller';
import { WarehouseController } from './controllers/warehouse.controller';

@Module({
  controllers: [StockController, WarehouseController],
  providers: [StockService, WarehouseService, InventoryPrismaService],
  exports: [StockService],
})
export class InventoryModule {}
