import axios from 'axios';

const API_URL = 'http://localhost:4000';
const SKU = 'TEST-SKU-' + Date.now(); // Unique SKU
let ACCESS_TOKEN = '';
let WAREHOUSE_ID = '';

async function runTests() {
  console.log('🚀 Starting Inventory Module Tests...');

  try {
    // 1. Auth: Login as Seed Admin
    const adminEmail = 'admin@example.com';
    const password = 'Admin123!';
    
    console.log(`\n1️⃣  Logging in as Admin: ${adminEmail}`);
    try {
      const authRes = await axios.post(`${API_URL}/auth/login`, {
        email: adminEmail,
        password: password,
      });
      console.log('✅ Admin Logged In');
      ACCESS_TOKEN = authRes.data.data.accessToken; 
    } catch (e: any) {
      console.error('❌ Login Failed:', e.response?.data || e.message);
      console.log('Attempting cleanup re-seed might be needed if user does not exist.');
      return;
    }
    
    // Note: If Signup makes a Customer, and we need Admin for Warehouse, we might be blocked.
    // I will check seed.ts content in the next step. If there is a seed admin, I will change this to Login.

    // 2. Create Warehouse
    console.log('\n2️⃣  Creating Warehouse...');
    try {
        const whRes = await axios.post(
        `${API_URL}/inventory/warehouses`,
        {
            name: `Warehouse ${Date.now()}`,
            location: 'Test City',
            isActive: true
        },
        { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
        );
        WAREHOUSE_ID = whRes.data.data.id;
        console.log(`✅ Warehouse Created: ${WAREHOUSE_ID}`);
    } catch (e: any) {
        console.error('❌ Create Warehouse Failed:', e.response?.data || e.message);
        // If 403 Forbidden, it means our user is not Admin.
        if (e.response?.status === 403) {
            console.error('⚠️ User is not Admin. Cannot create warehouse.');
            return;
        }
    }

    if (!WAREHOUSE_ID) return;

    // 3. Add Stock
    console.log(`\n3️⃣  Adding Stock (10 items) for SKU: ${SKU}`);
    await axios.post(
      `${API_URL}/inventory/stocks/${SKU}/${WAREHOUSE_ID}/add`,
      { quantity: 10 },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    console.log('✅ Stock Added');

    // 4. Verify Stock
    console.log('\n4️⃣  Verifying Stock Level...');
    const getRes1 = await axios.get(`${API_URL}/inventory/stocks/${SKU}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    const stock1 = getRes1.data.data.find((s: any) => s.warehouseId === WAREHOUSE_ID);
    console.log(`   Expected: 10, Actual: ${stock1.quantity}`);
    if (stock1.quantity !== 10) throw new Error('Stock verification failed');
    console.log('✅ Verified');

    // 5. Reserve Stock
    console.log('\n5️⃣  Reserving Stock (3 items)...');
    await axios.post(
      `${API_URL}/inventory/stocks/${SKU}/${WAREHOUSE_ID}/reserve`,
      { quantity: 3 },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    console.log('✅ Stock Reserved');

    // 6. Verify Reservation
    const getRes2 = await axios.get(`${API_URL}/inventory/stocks/${SKU}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    const stock2 = getRes2.data.data.find((s: any) => s.warehouseId === WAREHOUSE_ID);
    console.log(`   Reserved Expected: 3, Actual: ${stock2.reservedQty}`);
    if (stock2.reservedQty !== 3) throw new Error('Reservation verification failed');
    console.log('✅ Verified');

    // 7. Confirm Stock (Sale 2 items)
    console.log('\n7️⃣  Confirming Stock (Sale of 2 items)...');
    await axios.post(
      `${API_URL}/inventory/stocks/${SKU}/${WAREHOUSE_ID}/confirm`,
      { quantity: 2 },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    console.log('✅ Stock Confirmed');

    // 8. Verify Confirmation
    const getRes3 = await axios.get(`${API_URL}/inventory/stocks/${SKU}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    const stock3 = getRes3.data.data.find((s: any) => s.warehouseId === WAREHOUSE_ID);
    // Started at 10. Reserved 3. Confirmed 2.
    // Confirm decreases Qty by 2 AND Reserved by 2.
    // Qty: 10 - 2 = 8.
    // Reserved: 3 - 2 = 1.
    console.log(`   Qty Expected: 8, Actual: ${stock3.quantity}`);
    console.log(`   Rsrv Expected: 1, Actual: ${stock3.reservedQty}`);
    if (stock3.quantity !== 8 || stock3.reservedQty !== 1) throw new Error('Confirmation logic check failed');
    console.log('✅ Verified');

    // 9. Release Stock (Release remaining 1)
    console.log('\n9️⃣  Releasing Stock (1 item)...');
    await axios.post(
      `${API_URL}/inventory/stocks/${SKU}/${WAREHOUSE_ID}/release`,
      { quantity: 1 },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    console.log('✅ Stock Released');

    // 10. Final Verification
    const getRes4 = await axios.get(`${API_URL}/inventory/stocks/${SKU}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    const stock4 = getRes4.data.data.find((s: any) => s.warehouseId === WAREHOUSE_ID);
    // Reserved: 1 - 1 = 0.
    // Qty: Remains 8.
    console.log(`   Qty Expected: 8, Actual: ${stock4.quantity}`);
    console.log(`   Rsrv Expected: 0, Actual: ${stock4.reservedQty}`);
    if (stock4.quantity !== 8 || stock4.reservedQty !== 0) throw new Error('Final release check failed');
    console.log('✅ Verified');

    console.log('\n🎉 ALL TESTS PASSED!');

  } catch (e: any) {
    console.error('\n❌ TEST FAILED');
    if (e.response) {
        console.error('Status:', e.response.status);
        console.error('Data:', JSON.stringify(e.response.data, null, 2));
    } else {
        console.error(e.message);
    }
  }
}

runTests();
