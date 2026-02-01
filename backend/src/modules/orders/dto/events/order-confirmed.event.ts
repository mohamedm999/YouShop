export class OrderConfirmedEvent {
  orderId!: string;
  userId!: string;
  items!: Array<{
    sku: string;
    quantity: number;
    warehouseId: string;
  }>;
  timestamp!: Date;
}
