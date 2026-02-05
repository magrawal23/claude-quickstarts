// Backend API verification test
import http from 'http';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001, // Using new backend on 3001
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            rawBody: body,
            parseError: e.message
          });
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

(async () => {
  console.log('=== BACKEND VERIFICATION TEST ===\n');

  try {
    // Test 1: Health endpoint
    console.log('Test 1: Health endpoint');
    const health = await makeRequest('/health');
    console.log('  Status:', health.status);
    console.log('  Response:', health.data);
    if (health.status === 200 && health.data?.status === 'ok') {
      console.log('  ✓ PASS\n');
    } else {
      console.log('  ❌ FAIL\n');
      process.exit(1);
    }

    // Test 2: Get conversations
    console.log('Test 2: Get conversations');
    const conversations = await makeRequest('/api/conversations?user_id=1');
    console.log('  Status:', conversations.status);
    console.log('  Number of conversations:', conversations.data?.length || 0);
    if (conversations.status === 200) {
      console.log('  ✓ PASS\n');
    } else {
      console.log('  ❌ FAIL\n');
      process.exit(1);
    }

    // Test 3: Create a new conversation
    console.log('Test 3: Create conversation');
    const newConv = await makeRequest('/api/conversations', 'POST', {
      user_id: 1,
      title: 'Verification Test Conversation',
      model: 'claude-sonnet-4-5-20250929'
    });
    console.log('  Status:', newConv.status);
    console.log('  Raw body:', newConv.rawBody);
    console.log('  Response:', JSON.stringify(newConv.data, null, 2));
    console.log('  Created conversation ID:', newConv.data?.id);
    if (newConv.status === 201 && newConv.data?.id) {
      console.log('  ✓ PASS\n');
    } else {
      console.log('  ❌ FAIL - Expected 201 status and id field\n');
      process.exit(1);
    }

    console.log('=== ALL TESTS PASSED ===');
    console.log('✓ Backend is functioning correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
})();
