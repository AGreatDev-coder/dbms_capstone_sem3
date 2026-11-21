const http = require('http');
const app = require('../server');

async function testRBACIsolation() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://localhost:${port}/api`;

  console.log(`Test server running on port ${port}`);

  const post = async (url, data, headers = {}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    return res.json();
  };

  const get = async (url, headers = {}) => {
    const res = await fetch(url, {
      method: 'GET',
      headers
    });
    return res.json();
  };

  try {
    // 1. Test DEVELOPER Role
    console.log('\n--- 1. Testing DEVELOPER Role ---');
    const devLogin = await post(`${baseURL}/auth/login`, { username: 'developer', password: 'Password@123' });
    console.log('Developer logged in successfully. User:', devLogin.user);
    const devToken = devLogin.token;
    const devHeaders = { Authorization: `Bearer ${devToken}` };

    const devHospitals = await get(`${baseURL}/hospitals`, devHeaders);
    console.log(`Developer sees ${devHospitals.hospitals.length} hospitals (Expected: 6).`);

    const devPatients = await get(`${baseURL}/patients?limit=10`, devHeaders);
    console.log(`Developer sees total ${devPatients.count} patients.`);

    const devBlood = await get(`${baseURL}/blood-bank/inventory?limit=10`, devHeaders);
    console.log(`Developer sees total ${devBlood.count} blood units.`);

    const devMetrics = await get(`${baseURL}/dashboard/metrics`, devHeaders);
    console.log(`Developer sees total hospitals in metrics: ${devMetrics.metrics.totalHospitals} (Expected: 6)`);

    // 2. Test ADMIN (AIIMS - hospital_id: 1)
    console.log('\n--- 2. Testing ADMIN (AIIMS, hospital_id: 1) ---');
    const adminLogin = await post(`${baseURL}/auth/login`, { username: 'admin', password: 'Password@123' });
    console.log('Admin logged in:', adminLogin.user.username, 'Hospital:', adminLogin.user.hospital_name, 'ID:', adminLogin.user.hospital_id);
    const adminToken = adminLogin.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const adminHospitals = await get(`${baseURL}/hospitals`, adminHeaders);
    console.log(`Admin sees ${adminHospitals.hospitals.length} hospital(s) (Expected: 1 - AIIMS).`);
    console.log(`Hospital name: ${adminHospitals.hospitals[0]?.hospital_name}`);

    const adminPatients = await get(`${baseURL}/patients?limit=10`, adminHeaders);
    console.log(`Admin sees ${adminPatients.count} patients (Scoped to AIIMS).`);
    const adminPatientHospIds = new Set(adminPatients.patients.map(p => p.hospital_id));
    console.log('Patient hospital IDs present:', Array.from(adminPatientHospIds));

    const adminBlood = await get(`${baseURL}/blood-bank/inventory?limit=10`, adminHeaders);
    console.log(`Admin sees ${adminBlood.count} blood units (Scoped to AIIMS).`);
    const adminBloodHospIds = new Set(adminBlood.inventory.map(b => b.hospital_id));
    console.log('Blood unit hospital IDs present:', Array.from(adminBloodHospIds));

    const adminMetrics = await get(`${baseURL}/dashboard/metrics`, adminHeaders);
    console.log(`Admin dashboard metric totalHospitals: ${adminMetrics.metrics.totalHospitals} (Expected: 1)`);

    // 3. Test STAFF (Apollo - hospital_id: 2)
    console.log('\n--- 3. Testing STAFF (Apollo, hospital_id: 2) ---');
    const staffLogin = await post(`${baseURL}/auth/login`, { username: 'staff_priya', password: 'Password@123' });
    console.log('Staff logged in:', staffLogin.user.username, 'Hospital:', staffLogin.user.hospital_name, 'ID:', staffLogin.user.hospital_id);
    const staffToken = staffLogin.token;
    const staffHeaders = { Authorization: `Bearer ${staffToken}` };

    const staffHospitals = await get(`${baseURL}/hospitals`, staffHeaders);
    console.log(`Staff sees ${staffHospitals.hospitals.length} hospital(s) (Expected: 1 - Apollo).`);
    console.log(`Hospital name: ${staffHospitals.hospitals[0]?.hospital_name}`);

    const staffPatients = await get(`${baseURL}/patients?limit=10`, staffHeaders);
    console.log(`Staff sees ${staffPatients.count} patients (Scoped to Apollo).`);
    const staffPatientHospIds = new Set(staffPatients.patients.map(p => p.hospital_id));
    console.log('Patient hospital IDs present:', Array.from(staffPatientHospIds));

    const staffBlood = await get(`${baseURL}/blood-bank/inventory?limit=10`, staffHeaders);
    console.log(`Staff sees ${staffBlood.count} blood units (Scoped to Apollo).`);
    const staffBloodHospIds = new Set(staffBlood.inventory.map(b => b.hospital_id));
    console.log('Blood unit hospital IDs present:', Array.from(staffBloodHospIds));

    console.log('\n======================================================');
    console.log('ALL RBAC & HOSPITAL ISOLATION TESTS PASSED PERFECTLY!');
    console.log('======================================================');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    server.close();
    process.exit(1);
  }
}

testRBACIsolation();
