const axios = require('axios');

const API_URL = 'http://localhost:4000';

// Test Users
const USERS = {
  admin: { email: 'admin@example.com', password: 'Admin123!' },
  seller: { email: 'seller@example.com', password: 'Seller123!' },
  customer: { email: 'customer@example.com', password: 'Customer123!' }
};

let tokens = {};
let testData = {
  categoryId: '',
  productId: '',
  warehouseId: '',
  orderId: '',
  sku: ''
};

// Helper function to login
async function login(role) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, USERS[role]);
    tokens[role] = response.data.data.accessToken;
    console.log(`✅ ${role.toUpperCase()} logged in`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ ${role.toUpperCase()} login failed:`, error.response?.data?.message);
    throw error;
  }
}

// Helper to make request
async function makeRequest(method, url, role, data = null, expectFail = false) {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: role ? { Authorization: `Bearer ${tokens[role]}` } : {}
  };
  
  if (data) config.data = data;

  try {
    const response = await axios(config);
    if (expectFail) {
      console.log(`⚠️  Expected failure but got success: ${method} ${url} as ${role}`);
      return response.data;
    }
    console.log(`✅ ${method} ${url} as ${role || 'PUBLIC'}`);
    return response.data;
  } catch (error) {
    if (expectFail && error.response?.status === 403) {
      console.log(`✅ ${method} ${url} as ${role} - Correctly denied (403)`);
      return null;
    }
    const errMsg = error.response?.data?.message || error.message;
    const statusCode = error.response?.status || 'N/A';
    console.error(`❌ ${method} ${url} as ${role || 'PUBLIC'} [${statusCode}]:`, errMsg);
    if (!expectFail) throw new Error(errMsg);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 ===== TESTING AUTH ENDPOINTS =====\n');

  // 1. Signup new user
  const newUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  console.log('1️⃣  Testing Signup...');
  const signupResult = await makeRequest('POST', '/auth/signup', null, newUser);
  console.log(`   User ID: ${signupResult?.data?.user?.id}\n`);

  // 2. Login as admin, seller, customer
  console.log('2️⃣  Testing Login for all roles...');
  await login('admin');
  await login('seller');
  await login('customer');
  console.log('');

  // 3. Test with invalid credentials
  console.log('3️⃣  Testing Invalid Login...');
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'wrong@example.com',
      password: 'wrongpass'
    });
    console.log('⚠️  Login should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid credentials correctly rejected\n');
    }
  }
}

async function testCatalogEndpoints() {
  console.log('\n📚 ===== TESTING CATALOG ENDPOINTS =====\n');

  // 1. Get all categories (public)
  console.log('1️⃣  Testing Get All Categories...');
  const categories = await makeRequest('GET', '/catalog/categories', null);
  if (categories?.data?.length > 0) {
    testData.categoryId = categories.data[0].id;
    console.log(`   Found ${categories.data.length} categories\n`);
  }

  // 2. Create category (only ADMIN should succeed)
  console.log('2️⃣  Testing Create Category with different roles...');
  const categoryData = {
    name: `Test Category ${Date.now()}`,
    description: 'Test description'
  };
  
  await makeRequest('POST', '/catalog/categories', 'customer', categoryData, true); // Should fail
  await makeRequest('POST', '/catalog/categories', 'seller', categoryData, true); // Should fail
  const adminCategory = await makeRequest('POST', '/catalog/categories', 'admin', {
    name: `Admin Category ${Date.now()}`,
    description: 'Admin test'
  });
  if (adminCategory?.data?.id) {
    testData.categoryId = adminCategory.data.id;
  }
  console.log('');

  // 3. Get all products (public)
  console.log('3️⃣  Testing Get All Products...');
  try {
    const products = await makeRequest('GET', '/catalog/products', null);
    if (products?.data?.length > 0) {
      testData.productId = products.data[0].id;
      testData.sku = products.data[0].sku;
      console.log(`   Found ${products.data.length} products\n`);
    } else {
      console.log('   No products found\n');
    }
  } catch (error) {
    console.log('   ⚠️  Products endpoint failed, continuing with test...\n');
  }

  // 4. Create product (only ADMIN should succeed)
  console.log('4️⃣  Testing Create Product with different roles...');
  const productData = {
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 99.99,
    sku: `SKU-${Date.now()}`,
    categoryId: testData.categoryId
  };
  
  await makeRequest('POST', '/catalog/products', 'customer', productData, true); // Should fail
  await makeRequest('POST', '/catalog/products', 'seller', productData, true); // Should fail
  const adminProduct = await makeRequest('POST', '/catalog/products', 'admin', productData);
  if (adminProduct?.data?.id) {
    testData.productId = adminProduct.data.id;
    testData.sku = adminProduct.data.sku;
  }
  console.log('');

  // 5. Get product by ID (public)
  console.log('5️⃣  Testing Get Product by ID...');
  await makeRequest('GET', `/catalog/products/${testData.productId}`, null);
  console.log('');

  // 6. Update product (only ADMIN should succeed)
  console.log('6️⃣  Testing Update Product with different roles...');
  const updateData = { price: 149.99 };
  await makeRequest('PATCH', `/catalog/products/${testData.productId}`, 'customer', updateData, true);
  await makeRequest('PATCH', `/catalog/products/${testData.productId}`, 'seller', updateData, true);
  await makeRequest('PATCH', `/catalog/products/${testData.productId}`, 'admin', updateData);
  console.log('');

  // 7. Search products (public)
  console.log('7️⃣  Testing Search Products...');
  await makeRequest('GET', '/catalog/products/search?query=test', null);
  console.log('');
}

async function testInventoryEndpoints() {
  console.log('\n📦 ===== TESTING INVENTORY ENDPOINTS =====\n');

  // 1. Get all warehouses
  console.log('1️⃣  Testing Get All Warehouses...');
  const warehouses = await makeRequest('GET', '/inventory/warehouses', 'customer');
  if (warehouses?.data?.length > 0) {
    testData.warehouseId = warehouses.data[0].id;
    console.log(`   Found ${warehouses.data.length} warehouses\n`);
  }

  // 2. Create warehouse (only ADMIN should succeed)
  console.log('2️⃣  Testing Create Warehouse with different roles...');
  const warehouseData = {
    name: `Test Warehouse ${Date.now()}`,
    location: 'Test City',
    isActive: true
  };
  
  await makeRequest('POST', '/inventory/warehouses', 'customer', warehouseData, true);
  await makeRequest('POST', '/inventory/warehouses', 'seller', warehouseData, true);
  const adminWarehouse = await makeRequest('POST', '/inventory/warehouses', 'admin', warehouseData);
  if (adminWarehouse?.data?.id) {
    testData.warehouseId = adminWarehouse.data.id;
  }
  console.log('');

  // 3. Get stock by SKU
  console.log('3️⃣  Testing Get Stock by SKU...');
  if (testData.sku) {
    await makeRequest('GET', `/inventory/stocks/${testData.sku}`, 'customer');
    console.log('');
  }

  // 4. Add stock (only ADMIN/SELLER should succeed)
  console.log('4️⃣  Testing Add Stock with different roles...');
  const stockData = { quantity: 10 };
  await makeRequest('POST', `/inventory/stocks/${testData.sku}/${testData.warehouseId}/add`, 'customer', stockData, true);
  await makeRequest('POST', `/inventory/stocks/${testData.sku}/${testData.warehouseId}/add`, 'seller', stockData);
  await makeRequest('POST', `/inventory/stocks/${testData.sku}/${testData.warehouseId}/add`, 'admin', stockData);
  console.log('');

  // 5. Reserve stock (only ADMIN/SELLER should succeed)
  console.log('5️⃣  Testing Reserve Stock with different roles...');
  const reserveData = { quantity: 2 };
  await makeRequest('POST', `/inventory/stocks/${testData.sku}/${testData.warehouseId}/reserve`, 'customer', reserveData, true);
  await makeRequest('POST', `/inventory/stocks/${testData.sku}/${testData.warehouseId}/reserve`, 'seller', reserveData);
  console.log('');

  // 6. Get warehouse by ID
  console.log('6️⃣  Testing Get Warehouse by ID...');
  await makeRequest('GET', `/inventory/warehouses/${testData.warehouseId}`, 'customer');
  console.log('');
}

async function testOrdersEndpoints() {
  console.log('\n🛒 ===== TESTING ORDERS ENDPOINTS =====\n');

  // 1. Create order (authenticated users)
  console.log('1️⃣  Testing Create Order...');
  
  // Get available products first
  const products = await makeRequest('GET', '/catalog/products', 'customer');
  const warehouses = await makeRequest('GET', '/inventory/warehouses', 'customer');
  
  if (products?.data?.length > 0 && warehouses?.data?.length > 0) {
    const orderData = {
      items: [
        {
          sku: products.data[0].sku,
          quantity: 2,
          price: products.data[0].price,
          warehouseId: warehouses.data[0].id
        }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country'
      }
    };
    
    const customerOrder = await makeRequest('POST', '/orders', 'customer', orderData);
    if (customerOrder?.data?.id) {
      testData.orderId = customerOrder.data.id;
    }
    console.log('');
  }

  // 2. Get all orders (users see their own, admin sees all)
  console.log('2️⃣  Testing Get All Orders...');
  await makeRequest('GET', '/orders', 'customer');
  await makeRequest('GET', '/orders', 'admin');
  console.log('');

  // 3. Get order by ID
  console.log('3️⃣  Testing Get Order by ID...');
  if (testData.orderId) {
    await makeRequest('GET', `/orders/${testData.orderId}`, 'customer');
    console.log('');
  }

  // 4. Confirm order (only ADMIN/SELLER)
  console.log('4️⃣  Testing Confirm Order with different roles...');
  if (testData.orderId) {
    await makeRequest('PATCH', `/orders/${testData.orderId}/confirm`, 'customer', {}, true);
    await makeRequest('PATCH', `/orders/${testData.orderId}/confirm`, 'seller', {});
    console.log('');
  }

  // 5. Update order status (only ADMIN/SELLER)
  console.log('5️⃣  Testing Update Order Status...');
  if (testData.orderId) {
    await makeRequest('PATCH', `/orders/${testData.orderId}/status`, 'customer', { status: 'PROCESSING' }, true);
    await makeRequest('PATCH', `/orders/${testData.orderId}/status`, 'seller', { status: 'PROCESSING' });
    console.log('');
  }

  // 6. Get orders by status
  console.log('6️⃣  Testing Get Orders by Status...');
  await makeRequest('GET', '/orders?status=PROCESSING', 'admin');
  console.log('');
}

async function runAllTests() {
  console.log('\n🚀 ===== STARTING COMPREHENSIVE API TESTS =====');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    await testAuthEndpoints();
    await testCatalogEndpoints();
    await testInventoryEndpoints();
    await testOrdersEndpoints();

    console.log('\n✅ ===== ALL TESTS COMPLETED =====\n');
    console.log('📊 Summary:');
    console.log('   - Auth endpoints tested with all roles');
    console.log('   - Catalog endpoints tested with RBAC');
    console.log('   - Inventory endpoints tested with RBAC');
    console.log('   - Orders endpoints tested with RBAC\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runAllTests();
