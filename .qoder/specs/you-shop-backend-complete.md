# YouShop Backend Completion - Implementation Plan

## Overview
Complete the YouShop NestJS backend by implementing:
1. **Orders Module** - Full CRUD with order lifecycle management
2. **RabbitMQ Integration** - Asynchronous communication between Orders and Inventory
3. **Event-Driven Stock Management** - `order.created`, `order.confirmed`, `order.cancelled` events

---

## Current State

| Module | Status | Notes |
|--------|--------|-------|
| Auth | Complete | JWT, refresh tokens, roles (CUSTOMER/SELLER/ADMIN) |
| Catalog | Complete | Product/Category CRUD with SKU |
| Inventory | Complete | Stock reserve/release/confirm with transactions |
| Orders | Schema only | No controllers, services, or DTOs |

---

## Implementation Steps

### Phase 1: RabbitMQ Infrastructure

#### 1.1 Update `docker-compose.yml`
Add RabbitMQ service:
```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  environment:
    RABBITMQ_DEFAULT_USER: youshop
    RABBITMQ_DEFAULT_PASS: youshop_pass
  ports:
    - "5672:5672"    # AMQP
    - "15672:15672"  # Management UI
```

#### 1.2 Install Dependencies
```bash
npm install @nestjs/microservices amqplib amqp-connection-manager
```

#### 1.3 Update `.env`
```
RABBITMQ_URL=amqp://youshop:youshop_pass@localhost:5672
```

---

### Phase 2: Orders Module Structure

Create files in `backend/src/modules/orders/`:

```
orders/
├── orders.module.ts
├── prisma/
│   ├── orders-prisma.service.ts    [NEW]
│   └── schema.prisma               [EXISTS]
├── controllers/
│   └── orders.controller.ts        [NEW]
├── services/
│   ├── orders.service.ts           [NEW]
│   └── orders-events.service.ts    [NEW]
├── dto/
│   ├── create-order.dto.ts         [NEW]
│   ├── update-order-status.dto.ts  [NEW]
│   └── events/
│       ├── order-created.event.ts  [NEW]
│       ├── order-confirmed.event.ts[NEW]
│       └── order-cancelled.event.ts[NEW]
├── entities/
│   ├── order.entity.ts             [NEW]
│   └── order-item.entity.ts        [NEW]
└── generated/                      [EXISTS - Prisma]
```

---

### Phase 3: Orders Service Implementation

**File**: `backend/src/modules/orders/services/orders.service.ts`

| Method | Description |
|--------|-------------|
| `create(userId, dto)` | Create order + items, emit `order.created` |
| `findAll(userId?, status?)` | List orders with filters |
| `findOne(orderId, userId?)` | Get single order |
| `confirmOrder(orderId)` | Set CONFIRMED, emit `order.confirmed` |
| `cancelOrder(orderId, reason?)` | Set CANCELLED, emit `order.cancelled` |
| `updateStatus(orderId, status)` | PROCESSING/SHIPPED/DELIVERED transitions |

---

### Phase 4: Orders Controller Endpoints

**File**: `backend/src/modules/orders/controllers/orders.controller.ts`

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /orders` | CUSTOMER | Create new order |
| `GET /orders` | Authenticated | List orders (filtered by role) |
| `GET /orders/:id` | Authenticated | Get order details |
| `PATCH /orders/:id/confirm` | ADMIN/SELLER | Confirm order |
| `PATCH /orders/:id/cancel` | Authenticated | Cancel order |
| `PATCH /orders/:id/status` | ADMIN/SELLER | Update status |

---

### Phase 5: Event DTOs

**Location**: `backend/src/modules/orders/dto/events/`

```typescript
// OrderCreatedEvent
{
  orderId: string;
  userId: string;
  items: Array<{
    sku: string;
    quantity: number;
    warehouseId: string;
  }>;
  timestamp: Date;
}
```

Same structure for `OrderConfirmedEvent` and `OrderCancelledEvent` (+ reason field).

---

### Phase 6: Orders Events Service

**File**: `backend/src/modules/orders/services/orders-events.service.ts`

```typescript
@Injectable()
export class OrdersEventsService {
  constructor(@Inject('RABBITMQ_SERVICE') private client: ClientProxy) {}

  emitOrderCreated(order) { this.client.emit('order.created', event); }
  emitOrderConfirmed(order) { this.client.emit('order.confirmed', event); }
  emitOrderCancelled(order, reason?) { this.client.emit('order.cancelled', event); }
}
```

---

### Phase 7: Inventory Event Handlers

**File**: `backend/src/modules/inventory/controllers/inventory-events.controller.ts`

```typescript
@Controller()
export class InventoryEventsController {
  constructor(private stockService: StockService) {}

  @MessagePattern('order.created')
  async handleOrderCreated(data: OrderCreatedEvent) {
    for (const item of data.items) {
      await this.stockService.reserveStock(item.sku, item.warehouseId, { quantity: item.quantity });
    }
  }

  @MessagePattern('order.cancelled')
  async handleOrderCancelled(data: OrderCancelledEvent) {
    for (const item of data.items) {
      await this.stockService.releaseStock(item.sku, item.warehouseId, { quantity: item.quantity });
    }
  }

  @MessagePattern('order.confirmed')
  async handleOrderConfirmed(data: OrderConfirmedEvent) {
    for (const item of data.items) {
      await this.stockService.confirmStock(item.sku, item.warehouseId, item.quantity);
    }
  }
}
```

---

### Phase 8: Main.ts Hybrid App Configuration

**File**: `backend/src/main.ts`

Add microservice connection after app creation:
```typescript
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.RMQ,
  options: {
    urls: [configService.get('RABBITMQ_URL')],
    queue: 'inventory_queue',
    queueOptions: { durable: true },
  },
});
await app.startAllMicroservices();
```

---

### Phase 9: Module Registration

**File**: `backend/src/app.module.ts`
- Add `OrdersModule` to imports

**File**: `backend/src/modules/inventory/inventory.module.ts`
- Add `InventoryEventsController` to controllers

---

## Event Flow Diagram

```
┌──────────────────┐     order.created      ┌────────────────────┐
│  Orders Module   │ ─────────────────────► │  Inventory Module  │
│                  │                        │                    │
│  POST /orders    │     RabbitMQ           │  reserveStock()    │
│  → create order  │ ◄────────────────────► │  releaseStock()    │
│  → emit event    │     order.cancelled    │  confirmStock()    │
│                  │     order.confirmed    │                    │
└──────────────────┘                        └────────────────────┘
        │                                           │
        ▼                                           ▼
   Orders DB:5436                            Inventory DB:5435
```

---

## Files to Create/Modify

### New Files (Orders Module)
- `backend/src/modules/orders/orders.module.ts`
- `backend/src/modules/orders/prisma/orders-prisma.service.ts`
- `backend/src/modules/orders/controllers/orders.controller.ts`
- `backend/src/modules/orders/services/orders.service.ts`
- `backend/src/modules/orders/services/orders-events.service.ts`
- `backend/src/modules/orders/dto/create-order.dto.ts`
- `backend/src/modules/orders/dto/update-order-status.dto.ts`
- `backend/src/modules/orders/dto/events/order-created.event.ts`
- `backend/src/modules/orders/dto/events/order-confirmed.event.ts`
- `backend/src/modules/orders/dto/events/order-cancelled.event.ts`
- `backend/src/modules/orders/entities/order.entity.ts`
- `backend/src/modules/orders/entities/order-item.entity.ts`

### New Files (Inventory Module)
- `backend/src/modules/inventory/controllers/inventory-events.controller.ts`

### Modified Files
- `docker-compose.yml` - Add RabbitMQ service
- `backend/.env` - Add RABBITMQ_URL
- `backend/package.json` - Add @nestjs/microservices, amqplib
- `backend/src/main.ts` - Configure hybrid app
- `backend/src/app.module.ts` - Import OrdersModule
- `backend/src/modules/inventory/inventory.module.ts` - Add events controller

---

## Verification Steps

1. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**
   ```bash
   cd backend
   npm run prisma:migrate:orders
   npm run prisma:generate:all
   ```

3. **Start Application**
   ```bash
   npm run start:dev
   ```

4. **Test Order Creation**
   ```bash
   # Login to get token
   curl -X POST http://localhost:4000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"customer@example.com","password":"password"}'

   # Create order
   curl -X POST http://localhost:4000/orders \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "items": [{"sku":"PHONE-X","quantity":2,"unitPrice":999.99}],
       "shippingAddr": "123 Main St"
     }'
   ```

5. **Verify Stock Reserved**
   - Check RabbitMQ Management UI: http://localhost:15672
   - Query inventory database for reservedQty increase

6. **Test Order Confirmation**
   ```bash
   curl -X PATCH http://localhost:4000/orders/<orderId>/confirm \
     -H "Authorization: Bearer <admin-token>"
   ```

7. **Test Order Cancellation**
   ```bash
   curl -X PATCH http://localhost:4000/orders/<orderId>/cancel \
     -H "Authorization: Bearer <token>" \
     -d '{"reason":"Changed my mind"}'
   ```

8. **Run Lint/Typecheck**
   ```bash
   npm run lint
   npm run build
   ```

---

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Insufficient stock | BadRequestException from StockService, logged |
| RabbitMQ down | Log error, don't block order creation |
| Event processing fails | NACK message, retry via RabbitMQ |
| Invalid SKU | Validate against Catalog before order creation |

---

## Dependencies Summary

```json
{
  "@nestjs/microservices": "^11.0.1",
  "amqplib": "^0.10.3",
  "amqp-connection-manager": "^4.1.14"
}
```
