import axios from 'axios';

const API_URL = 'http://127.0.0.1:4000'; // Adjust endpoint if needed

// Credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';
const CUSTOMER_EMAIL = 'customer@example.com';
const CUSTOMER_PASSWORD = 'Customer123!';

async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    if (!response.data.data?.accessToken) {
      console.error(
        `Login success but no token for ${email}. Response:`,
        response.data,
      );
      return null; // Return null if structure is wrong
    }
    return response.data.data.accessToken; // Access token is nested in data object due to apiResponse wrapper
  } catch (error: any) {
    console.error(
      `Login failed for ${email}:`,
      error.code || error.message,
      error.response?.data,
    );
    return null;
  }
}

async function runTest() {
  console.log('--- Starting Orders Flow Test ---');

  // 1. Login
  const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const customerToken = await login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

  if (!adminToken || !customerToken) {
    console.error(
      'Failed to authenticate users. Ensure users exist (run seed if needed).',
    );
    return;
  }
  console.log('J Verified Authentication');

  // 2. Customer: Create Order
  let orderId;
  try {
    const createOrderDto = {
      items: [
        {
          sku: 'product-1',
          quantity: 2,
          unitPrice: 100,
          warehouseId: 'WH-001',
        },
        { sku: 'product-2', quantity: 1, unitPrice: 50, warehouseId: 'WH-001' },
      ],
      shippingAddr: '123 Test St, Test City',
    };

    // Note: Assuming axios transforms requests automatically.
    // Just in case, ensuring headers.
    const response = await axios.post(`${API_URL}/orders`, createOrderDto, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    orderId = response.data.data.id;
    console.log(`J Customer Created Order: ${orderId}`);
  } catch (error: any) {
    console.error(
      'Create Order Failed:',
      error.response?.data || error.message,
    );
    return;
  }

  // 3. Customer: List Orders
  try {
    const response = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const orders = response.data.data;
    if (orders.find((o: any) => o.id === orderId)) {
      console.log('J Customer sees the new order');
    } else {
      console.error('X Customer cannot see the new order');
    }
  } catch (error: any) {
    console.error(
      'List Orders (Customer) Failed:',
      error.response?.data || error.message,
    );
  }

  // 4. Admin: List Orders
  try {
    const response = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orders = response.data.data;
    if (orders.find((o: any) => o.id === orderId)) {
      console.log('J Admin sees the new order');
    } else {
      console.error('X Admin cannot see the new order');
    }
  } catch (error: any) {
    console.error(
      'List Orders (Admin) Failed:',
      error.response?.data || error.message,
    );
  }

  // 5. Admin: Confirm Order
  try {
    const response = await axios.patch(
      `${API_URL}/orders/${orderId}/confirm`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    console.log('J Admin Confirmed Order');
    if (response.data.data.status === 'CONFIRMED') {
      console.log('J Status is CONFIRMED');
    }
  } catch (error: any) {
    console.error(
      'Confirm Order Failed:',
      error.response?.data || error.message,
    );
  }

  // 6. Customer: Try to Cancel (Should Fail if status is checked strictly or succeed if only ownership checked)
  // Service logic: "if (status === CANCELLED || status === DELIVERED) throw BadRequest".
  // So CONFIRMED order CAN be cancelled by default logic unless blocked.
  // Wait, let's check confirmOrder logic: "if order.status !== PENDING throw BadRequest".
  // So Confirming a Confirmed order fails.
  // Cancelling a Confirmed order?
  // cancelOrder checks: "if (status === CANCELLED || status === DELIVERED)".
  // So it DOES NOT block cancelling a CONFIRMED order.
  // This might be a business logic gap unless intended. Usually you can cancel until shipped.

  try {
    const response = await axios.patch(
      `${API_URL}/orders/${orderId}/cancel`,
      { reason: 'Changed mind' },
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      },
    );
    console.log('J Customer Cancelled Order (Allowed for CONFIRMED status)');
  } catch (error: any) {
    console.log(
      `! Customer Cancel failed (Expected?): ${error.response?.data?.message}`,
    );
  }

  console.log('--- Test Finished ---');
}

runTest();
