import { PrismaClient as AuthPrismaClient, Role } from '../src/modules/auth/generated/prisma';
import { PrismaClient as CatalogPrismaClient } from '../src/modules/catalog/generated/prisma';
import { PrismaClient as InventoryPrismaClient } from '../src/modules/inventory/generated/prisma';
import { PrismaClient as OrdersPrismaClient } from '../src/modules/orders/generated/prisma';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Current directory:', process.cwd());
console.log('AUTH_DATABASE_URL:', process.env.AUTH_DATABASE_URL);
console.log('CATALOG_DATABASE_URL:', process.env.CATALOG_DATABASE_URL);
console.log('INVENTORY_DATABASE_URL:', process.env.INVENTORY_DATABASE_URL);
console.log('ORDERS_DATABASE_URL:', process.env.ORDERS_DATABASE_URL);

const authPrisma = new AuthPrismaClient({
  datasources: { db: { url: process.env.AUTH_DATABASE_URL } },
});

const catalogPrisma = new CatalogPrismaClient({
  datasources: { db: { url: process.env.CATALOG_DATABASE_URL } },
});

const inventoryPrisma = new InventoryPrismaClient({
  datasources: { db: { url: process.env.INVENTORY_DATABASE_URL } },
});

const ordersPrisma = new OrdersPrismaClient({
  datasources: { db: { url: process.env.ORDERS_DATABASE_URL } },
});

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // ==========================================
  // 1. AUTH DOMAIN
  // ==========================================
  console.log('\n--- Seeding Auth ---');
  let customerId = '';
  
  const users = [
    { email: 'admin@example.com', role: Role.ADMIN, pass: 'Admin123!', first: 'Super', last: 'Admin' },
    { email: 'seller@example.com', role: Role.SELLER, pass: 'Seller123!', first: 'Super', last: 'Seller' },
    { email: 'customer@example.com', role: Role.CUSTOMER, pass: 'Customer123!', first: 'John', last: 'Doe' },
  ];

  for (const u of users) {
    const existing = await authPrisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.pass, 10);
      const created = await authPrisma.user.create({
        data: {
          email: u.email,
          password: hashedPassword,
          firstName: u.first,
          lastName: u.last,
          role: u.role,
        },
      });
      console.log(`✅ User created: ${u.email} (${u.role})`);
      if (u.role === Role.CUSTOMER) customerId = created.id;
    } else {
      console.log(`ℹ️  User exists: ${u.email}`);
      if (u.role === Role.CUSTOMER) customerId = existing.id;
    }
  }

  // ==========================================
  // 2. CATALOG DOMAIN
  // ==========================================
  console.log('\n--- Seeding Catalog ---');
  
  const categories = [
    { name: 'Electronics', description: 'Gadgets and devices' },
    { name: 'Clothing', description: 'Apparel and fashion' },
    { name: 'Books', description: 'Fiction and non-fiction' },
  ];

  const categoryMap = new Map<string, string>(); // Name -> ID

  for (const cat of categories) {
    const existing = await catalogPrisma.category.findUnique({ where: { name: cat.name } });
    if (!existing) {
      const created = await catalogPrisma.category.create({ data: cat });
      console.log(`✅ Category created: ${created.name}`);
      categoryMap.set(cat.name, created.id);
    } else {
      console.log(`ℹ️  Category exists: ${cat.name}`);
      categoryMap.set(cat.name, existing.id);
    }
  }

  const products = [
    { 
      sku: 'PHONE-001', 
      name: 'Smartphone X', 
      price: 999.99, 
      category: 'Electronics',
      description: 'Latest model smartphone' 
    },
    { 
      sku: 'TSHIRT-001', 
      name: 'Classic T-Shirt', 
      price: 29.99, 
      category: 'Clothing',
      description: 'Cotton crew neck t-shirt' 
    },
    { 
      sku: 'BOOK-001', 
      name: 'The Great Code', 
      price: 15.50, 
      category: 'Books',
      description: 'A developer journey' 
    },
  ];

  for (const p of products) {
    const existing = await catalogPrisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      await catalogPrisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          price: p.price,
          description: p.description,
          categoryId: categoryMap.get(p.category),
        },
      });
      console.log(`✅ Product created: ${p.name} (${p.sku})`);
    } else {
      console.log(`ℹ️  Product exists: ${p.sku}`);
    }
  }

  // ==========================================
  // 3. INVENTORY DOMAIN
  // ==========================================
  console.log('\n--- Seeding Inventory ---');
  
  let warehouseId = '';
  const warehouse = { name: 'Main Warehouse', location: 'New York, USA' };
  
  const existingWarehouse = await inventoryPrisma.warehouse.findFirst({ where: { name: warehouse.name } });
  
  if (!existingWarehouse) {
    const created = await inventoryPrisma.warehouse.create({ data: warehouse });
    console.log(`✅ Warehouse created: ${created.name}`);
    warehouseId = created.id;
  } else {
    console.log(`ℹ️  Warehouse exists: ${warehouse.name}`);
    warehouseId = existingWarehouse.id;
  }

  for (const p of products) {
    const existingStock = await inventoryPrisma.stock.findUnique({
      where: {
        sku_warehouseId: { sku: p.sku, warehouseId },
      },
    });

    if (!existingStock) {
      await inventoryPrisma.stock.create({
        data: {
          sku: p.sku,
          warehouseId,
          quantity: 100, // Initial stock
          reservedQty: 0,
        },
      });
      console.log(`✅ Stock added for ${p.sku}: 100 units`);
    } else {
      console.log(`ℹ️  Stock exists for ${p.sku}`);
    }
  }

  // ==========================================
  // 4. ORDERS DOMAIN
  // ==========================================
  console.log('\n--- Seeding Orders ---');

  // Verify we have a customer
  if (customerId) {
    const existingOrder = await ordersPrisma.order.findFirst({ 
      where: { userId: customerId } 
    });

    if (!existingOrder) {
      const order = await ordersPrisma.order.create({
        data: {
          userId: customerId,
          status: 'PENDING',
          totalAmount: 1029.98,
          shippingAddr: '123 Main St, New York, NY',
          items: {
            create: [
              { sku: 'PHONE-001', quantity: 1, unitPrice: 999.99 },
              { sku: 'TSHIRT-001', quantity: 1, unitPrice: 29.99 },
            ],
          },
        },
      });
      console.log(`✅ Sample Order created for customer ${customerId}`);
    } else {
      console.log(`ℹ️  Sample Order exists for customer`);
    }
  } else {
    console.warn('⚠️  Skipping Order seed: No customer ID found');
  }

  console.log('\n🏁 Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await authPrisma.$disconnect();
    await catalogPrisma.$disconnect();
    await inventoryPrisma.$disconnect();
    await ordersPrisma.$disconnect();
  });
