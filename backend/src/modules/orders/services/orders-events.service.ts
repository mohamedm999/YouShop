import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderCreatedEvent } from '../dto/events/order-created.event';
import { OrderConfirmedEvent } from '../dto/events/order-confirmed.event';
import { OrderCancelledEvent } from '../dto/events/order-cancelled.event';

@Injectable()
export class OrdersEventsService {
  constructor(@Inject('RABBITMQ_SERVICE') private client: ClientProxy) {}

  emitOrderCreated(event: OrderCreatedEvent) {
    this.client.emit('order.created', event);
  }

  emitOrderConfirmed(event: OrderConfirmedEvent) {
    this.client.emit('order.confirmed', event);
  }

  emitOrderCancelled(event: OrderCancelledEvent) {
    this.client.emit('order.cancelled', event);
  }
}
