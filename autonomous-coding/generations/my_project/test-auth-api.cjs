const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints\n');

  let token = null;

  try {
    // Step 1: Test login
    console.log('Step 1: POST /api/auth/login');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com'
    });
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginRes.data, null, 2));

    if (loginRes.status === 200 && loginRes.data.token) {
      console.log('✅ Login successful - token received\n');
      token = loginRes.data.token;
    } else {
      console.log('❌ Login failed\n');
      return;
    }

    // Step 2: Test GET /api/auth/me with token
    console.log('Step 2: GET /api/auth/me with token');
    const meRes = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', meRes.status);
    console.log('Response:', JSON.stringify(meRes.data, null, 2));

    if (meRes.status === 200 && meRes.data.user) {
      console.log('✅ User info retrieved successfully\n');
    } else {
      console.log('❌ Failed to get user info\n');
    }

    // Step 3: Test GET /api/auth/me without token
    console.log('Step 3: GET /api/auth/me without token (should fail)');
    const noTokenRes = await makeRequest('GET', '/api/auth/me');
    console.log('Status:', noTokenRes.status);
    console.log('Response:', JSON.stringify(noTokenRes.data, null, 2));

    if (noTokenRes.status === 401) {
      console.log('✅ Correctly rejected request without token\n');
    } else {
      console.log('❌ Should have rejected request without token\n');
    }

    // Step 4: Test profile update
    console.log('Step 4: PUT /api/auth/profile');
    const profileRes = await makeRequest('PUT', '/api/auth/profile', {
      name: 'Updated Test User'
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', profileRes.status);
    console.log('Response:', JSON.stringify(profileRes.data, null, 2));

    if (profileRes.status === 200) {
      console.log('✅ Profile updated successfully\n');
    } else {
      console.log('❌ Profile update failed\n');
    }

    // Step 5: Test logout
    console.log('Step 5: POST /api/auth/logout');
    const logoutRes = await makeRequest('POST', '/api/auth/logout', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', logoutRes.status);
    console.log('Response:', JSON.stringify(logoutRes.data, null, 2));

    if (logoutRes.status === 200) {
      console.log('✅ Logout successful\n');
    } else {
      console.log('❌ Logout failed\n');
    }

    // Step 6: Try to use token after logout (should fail)
    console.log('Step 6: GET /api/auth/me with invalidated token (should fail)');
    const invalidRes = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', invalidRes.status);
    console.log('Response:', JSON.stringify(invalidRes.data, null, 2));

    if (invalidRes.status === 401) {
      console.log('✅ Token correctly invalidated after logout\n');
    } else {
      console.log('❌ Token should be invalid after logout\n');
    }

    console.log('✅ All authentication endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthEndpoints();
