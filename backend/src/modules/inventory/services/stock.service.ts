import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InventoryPrismaService } from '../prisma/inventory-prisma.service';
import { UpdateStockDto } from '../dto/stock/update-stock.dto';
import { ReserveStockDto } from '../dto/stock/reserve-stock.dto';
import { ReleaseStockDto } from '../dto/stock/release-stock.dto';
import { StockEntity } from '../entities/stock.entity';

@Injectable()
export class StockService {
  constructor(private readonly prisma: InventoryPrismaService) {}

  async getStockBySku(sku: string): Promise<StockEntity[]> {
    const stocks = await this.prisma.stock.findMany({
      where: { sku },
      include: { warehouse: true },
    });
    return stocks.map((s) => plainToInstance(StockEntity, s));
  }

  async addStock(
    sku: string,
    warehouseId: string,
    dto: UpdateStockDto,
  ): Promise<StockEntity> {
    const { quantity } = dto;

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const stock = await this.prisma.stock.upsert({
      where: {
        sku_warehouseId: { sku, warehouseId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        sku,
        warehouseId,
        quantity,
      },
      include: { warehouse: true },
    });

    return plainToInstance(StockEntity, stock);
  }

  async reserveStock(
    sku: string,
    warehouseId: string,
    dto: ReserveStockDto,
  ): Promise<StockEntity> {
    const { quantity } = dto;

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: { sku_warehouseId: { sku, warehouseId } },
        include: { warehouse: true },
      });

      if (!stock) throw new NotFoundException('Stock not found');

      if (stock.quantity - stock.reservedQty < quantity) {
        throw new BadRequestException('Insufficient available stock');
      }

      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          reservedQty: { increment: quantity },
        },
        include: { warehouse: true },
      });

      return plainToInstance(StockEntity, updatedStock);
    });
  }

  async releaseStock(
    sku: string,
    warehouseId: string,
    dto: ReleaseStockDto,
  ): Promise<StockEntity> {
    const { quantity } = dto;

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: { sku_warehouseId: { sku, warehouseId } },
        include: { warehouse: true },
      });

      if (!stock) throw new NotFoundException('Stock not found');

      if (stock.reservedQty < quantity) {
        throw new BadRequestException('Cannot release more than reserved');
      }

      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          reservedQty: { decrement: quantity },
        },
        include: { warehouse: true },
      });

      return plainToInstance(StockEntity, updatedStock);
    });
  }

  async confirmStock(
    sku: string,
    warehouseId: string,
    quantity: number,
  ): Promise<StockEntity> {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: {
          sku_warehouseId: { sku, warehouseId },
        },
        include: { warehouse: true },
      });

      if (!stock) {
        throw new NotFoundException('Stock not found');
      }

      if (stock.reservedQty < quantity) {
        throw new BadRequestException(
          'Cannot confirm more than reserved quantity',
        );
      }

      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            decrement: quantity,
          },
          reservedQty: {
            decrement: quantity,
          },
        },
        include: { warehouse: true },
      });

      return plainToInstance(StockEntity, updatedStock);
    });
  }
}
