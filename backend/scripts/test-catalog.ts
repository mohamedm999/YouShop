import axios from 'axios';

const API_URL = 'http://localhost:4000';

// Credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';

const USER_EMAIL = 'user_catalog_test@example.com';
const USER_PASSWORD = 'User123!';

async function runCatalogTests() {
  console.log('🚀 Starting Catalog Module Tests...');
  let adminToken = '';
  let userToken = '';
  let productId = '';

  try {
    // 0. Setup: Get Tokens
    console.log(`\n0️⃣  Setting up Tokens...`);
    
    // Admin Login
    try {
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        adminToken = adminRes.data.data.accessToken;
        console.log('✅ Admin Token Acquired');
    } catch (e) {
        console.error('❌ Admin Login Failed. Ensure admin is seeded.');
        return;
    }

    // User Signup & Login
    try {
        // Try login first
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD
        });
        userToken = loginRes.data.data.accessToken;
    } catch (e) {
        // Signup if login fails
        await axios.post(`${API_URL}/auth/signup`, {
            email: USER_EMAIL,
            password: USER_PASSWORD,
            firstName: 'Catalog',
            lastName: 'Tester'
        });
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD
        });
         userToken = loginRes.data.data.accessToken;
    }
    console.log('✅ User Token Acquired');

    // 1. Create Product (Admin) - SUCCESS
    console.log(`\n1️⃣  [ADMIN] Creating Product...`);
    const createRes = await axios.post(`${API_URL}/catalog/products`, {
        name: `Test Product ${Date.now()}`,
        description: 'A test product',
        price: 99.99,
        sku: `SKU-${Date.now()}`
    }, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    productId = createRes.data.data.id;
    console.log(`✅ Product Created: ${productId}`);

    // 2. Create Product (User) - FAIL
    console.log(`\n2️⃣  [USER] Try Creating Product (Should Fail)...`);
    try {
        await axios.post(`${API_URL}/catalog/products`, {
            name: 'Hacker Product',
            price: 1.00,
            sku: 'HACK-SKU'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        throw new Error('User was able to create product! Security hole!');
    } catch (e: any) {
        if (e.response && e.response.status === 403) {
            console.log('✅ Access Denied (Expected 403)');
        } else {
            console.error('❌ Unexpected error or success:', e.message);
        }
    }

    // 3. Get All Products (Public)
    console.log(`\n3️⃣  [PUBLIC] Get All Products...`);
    const getAllRes = await axios.get(`${API_URL}/catalog/products`);
    const found = getAllRes.data.data.find((p: any) => p.id === productId);
    if (found) console.log('✅ Product found in public list');
    else console.error('❌ Product NOT found in public list');

    // 4. Update Product (Admin)
    console.log(`\n4️⃣  [ADMIN] Update Product...`);
    await axios.patch(`${API_URL}/catalog/products/${productId}`, {
        price: 199.99
    }, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Product Updated');

    // 5. Delete Product (Admin)
    console.log(`\n5️⃣  [ADMIN] Delete Product...`);
    await axios.delete(`${API_URL}/catalog/products/${productId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Product Deleted');

    console.log('\n🎉 CATALOG TESTS PASSED!');

  } catch (e: any) {
    console.error('\n❌ CATALOG TEST FAILED');
    if (e.response) {
        console.error('Status:', e.response.status);
        console.error('Data:', JSON.stringify(e.response.data, null, 2));
    } else {
        console.error(e.message);
    }
  }
}

runCatalogTests();
