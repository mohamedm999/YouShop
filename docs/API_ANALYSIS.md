# 📊 YouShop API - Complete Module Analysis

## 🔐 AUTH MODULE

### Database: `auth` (Port 5433)
**Schema Models:**
- `User` - id, email, password, firstName, lastName, role, isActive
- `RefreshToken` - id, token, userId, expiresAt
- `Role` enum: CUSTOMER, SELLER, ADMIN

### Endpoints:
| Method | Endpoint | Access | DTO | Description |
|--------|----------|--------|-----|-------------|
| POST | `/auth/signup` | Public | SignupDto | Register new user (email, password, firstName, lastName) |
| POST | `/auth/login` | Public | LoginDto | Login user (email, password) → Returns accessToken + refreshToken |
| POST | `/auth/refresh` | Public | - | Refresh access token using refresh token from cookie |
| POST | `/auth/logout` | Authenticated | - | Logout and invalidate refresh token |

**Key Logic:**
- Password hashing with bcrypt
- JWT tokens (15min access, 7d refresh)
- Refresh token stored in httpOnly cookie
- Token rotation on refresh

---

## 📚 CATALOG MODULE

### Database: `catalog` (Port 5434)
**Schema Models:**
- `Product` - id, sku (unique), name, description, price, imageUrl, isActive, categoryId
- `Category` - id, name (unique), description

### Endpoints:

#### Categories
| Method | Endpoint | Access | DTO | Description |
|--------|----------|--------|-----|-------------|
| POST | `/catalog/categories` | ADMIN | CreateCategoryDto | Create category (name, description) |
| GET | `/catalog/categories` | Public | - | Get all categories |
| GET | `/catalog/categories/:id` | Public | - | Get category by ID |
| PATCH | `/catalog/categories/:id` | ADMIN | UpdateCategoryDto | Update category |
| DELETE | `/catalog/categories/:id` | ADMIN | - | Delete category |

#### Products
| Method | Endpoint | Access | DTO | Description |
|--------|----------|--------|-----|-------------|
| POST | `/catalog/products` | ADMIN | CreateProductDto | Create product (sku, name, price, description, categoryId) |
| GET | `/catalog/products` | Public | - | Get all products with category info |
| GET | `/catalog/products/:id` | Public | - | Get product by ID |
| PATCH | `/catalog/products/:id` | ADMIN | UpdateProductDto | Update product |
| DELETE | `/catalog/products/:id` | ADMIN | - | Delete product |

**Key Logic:**
- SKU must be unique
- CategoryId validated before product creation
- Products include category relation
- Only ADMIN can manage catalog

---

## 📦 INVENTORY MODULE

### Database: `inventory` (Port 5435)
**Schema Models:**
- `Stock` - id, sku, quantity, reservedQty, warehouseId
- `Warehouse` - id, name, location, isActive
- **No Foreign Keys** - SKU references catalog via business key

### Endpoints:

#### Warehouses
| Method | Endpoint | Access | DTO | Description |
|--------|----------|--------|-----|-------------|
| POST | `/inventory/warehouses` | ADMIN | CreateWarehouseDto | Create warehouse (name, location) |
| GET | `/inventory/warehouses` | ADMIN, SELLER | - | Get all warehouses |
| GET | `/inventory/warehouses/:id` | ADMIN, SELLER | - | Get warehouse by ID |
| PATCH | `/inventory/warehouses/:id` | ADMIN | UpdateWarehouseDto | Update warehouse |
| DELETE | `/inventory/warehouses/:id` | ADMIN | - | Delete warehouse |

#### Stock
| Method | Endpoint | Access | DTO | Description |
|--------|----------|--------|-----|-------------|
| GET | `/inventory/stocks/:sku` | ALL AUTHENTICATED | - | Get stock for SKU across all warehouses |
| POST | `/inventory/stocks/:sku/:warehouseId/add` | ADMIN, SELLER | UpdateStockDto | Add stock quantity |
| POST | `/inventory/stocks/:sku/:warehouseId/reserve` | ADMIN, SELLER | ReserveStockDto | Reserve stock for order |
| POST | `/inventory/stocks/:sku/:warehouseId/release` | ADMIN, SELLER | ReleaseStockDto | Release reserved stock |
| POST | `/inventory/stocks/:sku/:warehouseId/confirm` | ADMIN, SELLER | ConfirmStockDto | Confirm stock (finalize sale) |

**Key Logic:**
- Stock operations use transactions for consistency
- `reservedQty` tracks pending orders
- Available stock = `quantity - reservedQty`
- Upsert pattern for adding stock (create if not exists)

---

## 🛒 ORDERS MODULE

### Database: `orders` (Port 5436)
**Schema Models:**
- `Order` - id, userId, status, totalAmount, shippingAddr
- `OrderItem` - id, orderId, sku, quantity, unitPrice, warehouseId
- `OrderStatus` enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

### Endpoints:
| Method | Endpoint | Access | DTO | Description |
|--------|----------|--------|-----|-------------|
| POST | `/orders` | CUSTOMER | CreateOrderDto | Create order (items[], shippingAddr) |
| GET | `/orders` | Authenticated | Query: status | Get orders (customer sees own, admin/seller see all) |
| GET | `/orders/:id` | Authenticated | - | Get order by ID (ownership checked) |
| PATCH | `/orders/:id/confirm` | ADMIN, SELLER | - | Confirm order (PENDING → CONFIRMED) |
| PATCH | `/orders/:id/cancel` | Authenticated | Body: reason | Cancel order |
| PATCH | `/orders/:id/status` | ADMIN, SELLER | UpdateOrderStatusDto | Update order status |

**Key Logic:**
- Order creation emits `OrderCreated` event to RabbitMQ
- Total amount calculated from items
- Items include: sku, quantity, unitPrice, warehouseId
- Status flow: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- Customers can only see their own orders

---

## 🔑 Role-Based Access Control (RBAC)

### Permission Matrix:

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| **Users** | Public (signup) | Self | Self | - |
| **Categories** | ADMIN | Public | ADMIN | ADMIN |
| **Products** | ADMIN | Public | ADMIN | ADMIN |
| **Warehouses** | ADMIN | ADMIN/SELLER | ADMIN | ADMIN |
| **Stock** | ADMIN/SELLER | All Auth | ADMIN/SELLER | - |
| **Orders** | CUSTOMER | Owner/ADMIN/SELLER | ADMIN/SELLER | - |

---

## 📡 Event-Driven Architecture

### RabbitMQ Events:
- **OrderCreated** - Emitted when order is created
  - Payload: orderId, userId, items[], timestamp
  - Purpose: Trigger inventory reservation

---

## 🗃️ Microservices Architecture

### Database Isolation:
Each module has its own PostgreSQL database:
- Auth: `postgresql://auth_user:auth_pass@localhost:5433/auth`
- Catalog: `postgresql://catalog_user:catalog_pass@localhost:5434/catalog`
- Inventory: `postgresql://inventory_user:inventory_pass@localhost:5435/inventory`
- Orders: `postgresql://orders_user:orders_pass@localhost:5436/orders`

### Cross-Service References:
- **No Foreign Keys** between services
- Business keys used: `sku`, `userId`
- Event-driven communication via RabbitMQ

---

## 📝 DTOs (Data Transfer Objects)

### Auth:
- `SignupDto`: email, password, firstName, lastName
- `LoginDto`: email, password

### Catalog:
- `CreateCategoryDto`: name, description?
- `CreateProductDto`: sku, name, price, description?, imageUrl?, categoryId?
- `UpdateProductDto`: Partial of CreateProductDto

### Inventory:
- `CreateWarehouseDto`: name, location?, isActive?
- `UpdateStockDto`: quantity
- `ReserveStockDto`: quantity
- `ReleaseStockDto`: quantity
- `ConfirmStockDto`: quantity

### Orders:
- `CreateOrderItemDto`: sku, quantity, unitPrice, warehouseId
- `CreateOrderDto`: items[], shippingAddr
- `UpdateOrderStatusDto`: status

---

## 🔒 Security Features

1. **JWT Authentication**
   - Access tokens (15 min expiry)
   - Refresh tokens (7 days, httpOnly cookie)
   - Token rotation

2. **Role-Based Guards**
   - `@Roles()` decorator for endpoint protection
   - `@Public()` decorator for public endpoints
   - JwtAuthGuard globally applied

3. **Password Security**
   - bcrypt hashing (10 rounds)
   - No plain text storage

---

## 🧪 Test Users (from seed)

```javascript
// Admin
{ email: 'admin@example.com', password: 'Admin123!', role: 'ADMIN' }

// Seller
{ email: 'seller@example.com', password: 'Seller123!', role: 'SELLER' }

// Customer
{ email: 'customer@example.com', password: 'Customer123!', role: 'CUSTOMER' }
```

---

## 🚀 Typical Workflows

### 1. User Registration & Login
```
1. POST /auth/signup → Create user
2. POST /auth/login → Get tokens
3. Use accessToken in Authorization header
```

### 2. Create Product (Admin)
```
1. Login as ADMIN
2. POST /catalog/categories → Create category
3. POST /catalog/products → Create product with categoryId
4. POST /inventory/stocks/:sku/:warehouseId/add → Add stock
```

### 3. Place Order (Customer)
```
1. Login as CUSTOMER
2. GET /catalog/products → Browse products
3. GET /inventory/stocks/:sku → Check availability
4. POST /orders → Create order
   - System emits OrderCreated event
   - Inventory auto-reserves stock
```

### 4. Process Order (Seller/Admin)
```
1. GET /orders → View all orders
2. PATCH /orders/:id/confirm → Confirm order
3. PATCH /orders/:id/status → Update to PROCESSING
4. PATCH /orders/:id/status → Update to SHIPPED
5. PATCH /orders/:id/status → Update to DELIVERED
```

---

## ⚠️ Important Notes

1. **Cross-Service Data**: Services don't share databases. Use events for synchronization.
2. **Stock Management**: Always reserve before confirming orders
3. **Available Stock**: `quantity - reservedQty`
4. **Order Cancellation**: Must release reserved stock
5. **Category Required**: Products should have valid categoryId
6. **Unique Constraints**: SKU (products), Email (users), Category Name
