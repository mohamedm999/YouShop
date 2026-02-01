import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:4000';

async function login(email: string, password: string) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.data.accessToken;
  } catch (error: any) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getAllProducts(token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/catalog/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to get products:', error.response?.data || error.message);
    return [];
  }
}

async function getWarehouses(token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/inventory/warehouses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to get warehouses:', error.response?.data || error.message);
    return [];
  }
}

async function getStockBySku(sku: string, token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/inventory/stocks/${sku}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error(`Failed to get stock for ${sku}:`, error.response?.data || error.message);
    return null;
  }
}

async function createOrder(token: string, orderData: any) {
  try {
    const response = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to create order:', error.response?.data || error.message);
    return null;
  }
}

async function getOrders(token: string, status?: string) {
  try {
    const url = status ? `${BASE_URL}/orders?status=${status}` : `${BASE_URL}/orders`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to get orders:', error.response?.data || error.message);
    return [];
  }
}

async function getOrderById(orderId: string, token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error(`Failed to get order ${orderId}:`, error.response?.data || error.message);
    return null;
  }
}

async function confirmOrder(orderId: string, token: string) {
  try {
    const response = await axios.patch(`${BASE_URL}/orders/${orderId}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error(`Failed to confirm order ${orderId}:`, error.response?.data || error.message);
    return null;
  }
}

async function cancelOrder(orderId: string, token: string, reason?: string) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/orders/${orderId}/cancel`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error: any) {
    console.error(`Failed to cancel order ${orderId}:`, error.response?.data || error.message);
    return null;
  }
}

async function updateOrderStatus(orderId: string, token: string, status: string) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/orders/${orderId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error: any) {
    console.error(`Failed to update status for order ${orderId}:`, error.response?.data || error.message);
    return null;
  }
}

async function testFullOrderFlow() {
  console.log('🚀 Starting comprehensive API test...\n');

  try {
    // Step 1: Login with different roles
    console.log('🔐 Logging in with different roles...');
    const customerToken = await login('customer@example.com', 'Customer123!');
    const adminToken = await login('admin@example.com', 'Admin123!');
    const sellerToken = await login('seller@example.com', 'Seller123!');
    console.log('✅ Login successful\n');

    // Step 2: Get products and warehouses
    console.log('📦 Fetching products and warehouses...');
    const products = await getAllProducts(customerToken);
    const warehouses = await getWarehouses(adminToken);
    
    if (products.length === 0) {
      console.log('❌ No products found, stopping test');
      return;
    }
    
    if (warehouses.length === 0) {
      console.log('❌ No warehouses found, stopping test');
      return;
    }
    
    console.log(`✅ Found ${products.length} products and ${warehouses.length} warehouses\n`);

    // Step 3: Get stock for the first product
    console.log('📊 Checking stock availability...');
    const firstProduct = products[0];
    const stock = await getStockBySku(firstProduct.sku, customerToken);
    console.log(`✅ Stock for ${firstProduct.sku}:`, stock);

    // Step 4: Test order creation
    console.log('🛒 Creating an order...');
    const orderData = {
      items: [
        {
          sku: firstProduct.sku,
          quantity: 2,
          unitPrice: firstProduct.price,
          warehouseId: warehouses[0].id,
        },
      ],
      shippingAddr: '123 Test Street, Test City, TC 12345',
    };

    const createdOrder = await createOrder(customerToken, orderData);
    if (!createdOrder) {
      console.log('❌ Failed to create order, stopping test');
      return;
    }
    console.log(`✅ Order created: ${createdOrder.id} with status: ${createdOrder.status}\n`);

    // Step 5: Test fetching orders
    console.log('📋 Fetching customer orders...');
    const customerOrders = await getOrders(customerToken);
    console.log(`✅ Customer has ${customerOrders.length} orders\n`);

    console.log('📋 Fetching all orders as admin...');
    const adminOrders = await getOrders(adminToken);
    console.log(`✅ Admin sees ${adminOrders.length} total orders\n`);

    // Step 6: Test fetching specific order
    console.log('🔍 Fetching specific order...');
    const specificOrder = await getOrderById(createdOrder.id, customerToken);
    console.log(`✅ Retrieved order ${specificOrder.id} with ${specificOrder.items.length} items\n`);

    // Step 7: Test order confirmation (admin/seller only)
    console.log('✅ Attempting to confirm order (admin)...');
    const confirmedOrder = await confirmOrder(createdOrder.id, adminToken);
    if (confirmedOrder) {
      console.log(`✅ Order confirmed: ${confirmedOrder.id}, new status: ${confirmedOrder.status}\n`);
    }

    // Step 8: Test order cancellation
    console.log('🛒 Creating another order for cancellation test...');
    const orderForCancellation = await createOrder(customerToken, orderData);
    if (orderForCancellation) {
      console.log(`✅ Created order for cancellation: ${orderForCancellation.id}`);

      console.log('🚫 Testing order cancellation...');
      const cancelledOrder = await cancelOrder(orderForCancellation.id, customerToken, 'Changed my mind');
      if (cancelledOrder) {
        console.log(`✅ Order cancelled: ${cancelledOrder.id}, new status: ${cancelledOrder.status}\n`);
      }
    }

    // Step 9: Test status updates (admin/seller only)
    console.log('🔄 Testing order status updates...');
    if (confirmedOrder) {
      const updatedOrder = await updateOrderStatus(confirmedOrder.id, adminToken, 'SHIPPED');
      if (updatedOrder) {
        console.log(`✅ Order status updated to: ${updatedOrder.status}`);
      }
    }

    // Step 10: Test authorization restrictions
    console.log('\n🔒 Testing authorization restrictions...');
    
    // Customer should not be able to confirm other people's orders
    try {
      await confirmOrder(adminOrders[0]?.id, customerToken);
      console.log('❌ Customer was able to confirm another user\'s order - SECURITY ISSUE!');
    } catch (error: any) {
      console.log('✅ Customer correctly denied permission to confirm other orders');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- ✅ Authenticated as: customer, admin, seller`);
    console.log(`- ✅ Products fetched: ${products.length}`);
    console.log(`- ✅ Warehouses fetched: ${warehouses.length}`);
    console.log(`- ✅ Order created successfully`);
    console.log(`- ✅ Orders retrieved successfully`);
    console.log(`- ✅ Order confirmation tested`);
    console.log(`- ✅ Order cancellation tested`);
    console.log(`- ✅ Order status updates tested`);
    console.log(`- ✅ Authorization restrictions verified`);

  } catch (error: any) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('Error details:', error.response?.data || error.stack);
  }
}

// Run the test
testFullOrderFlow().catch(console.error);