import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StockService } from '../services/stock.service';
import { OrderCreatedEvent } from '../../orders/dto/events/order-created.event';
import { OrderConfirmedEvent } from '../../orders/dto/events/order-confirmed.event';
import { OrderCancelledEvent } from '../../orders/dto/events/order-cancelled.event';

@Controller()
export class InventoryEventsController {
  constructor(private readonly stockService: StockService) {}

  @MessagePattern('order.created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    // Reserve stock for each item
    for (const item of data.items) {
      await this.stockService.reserveStock(item.sku, item.warehouseId, {
        quantity: item.quantity,
      });
    }
  }

  @MessagePattern('order.confirmed')
  async handleOrderConfirmed(@Payload() data: OrderConfirmedEvent) {
    // Confirm stock deduction
    for (const item of data.items) {
      await this.stockService.confirmStock(
        item.sku,
        item.warehouseId,
        item.quantity,
      );
    }
  }

  @MessagePattern('order.cancelled')
  async handleOrderCancelled(@Payload() data: OrderCancelledEvent) {
    // Release reserved stock
    for (const item of data.items) {
      await this.stockService.releaseStock(item.sku, item.warehouseId, {
        quantity: item.quantity,
      });
    }
  }
}
