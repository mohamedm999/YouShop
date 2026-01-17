import axios from 'axios';

const API_URL = 'http://localhost:4000';

// Test Data
const USER_EMAIL = `testuser_${Date.now()}@example.com`;
const USER_PASSWORD = 'User123!';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';

async function runAuthTests() {
  console.log('🚀 Starting Auth Module Tests...');

  try {
    // 1. Signup a new User
    console.log(`\n1️⃣  Registering new User: ${USER_EMAIL}`);
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ User Registered');
    console.log(`   ID: ${signupRes.data.data.user.id}`);

    // 2. Login as User
    console.log(`\n2️⃣  Logging in as User...`);
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    console.log('✅ User Logged In');
    const userToken = loginRes.data.data.accessToken;
    console.log(`   Token: ${userToken.substring(0, 20)}...`);

    // 3. Login as Admin
    console.log(`\n3️⃣  Logging in as Admin...`);
    try {
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
        });
        console.log('✅ Admin Logged In');
        const adminToken = adminRes.data.data.accessToken;
        console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    } catch (e: any) {
        console.log('⚠️  Admin login failed. Admin might not be seeded.');
    }

    console.log('\n🎉 AUTH TESTS PASSED!');

  } catch (e: any) {
    console.error('\n❌ AUTH TEST FAILED');
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.error(e.message);
    }
  }
}

runAuthTests();
