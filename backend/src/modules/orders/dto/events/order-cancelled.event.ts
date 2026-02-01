export class OrderCancelledEvent {
  orderId!: string;
  userId!: string;
  items!: Array<{
    sku: string;
    quantity: number;
    warehouseId: string;
  }>;
  reason?: string;
  timestamp!: Date;
}
