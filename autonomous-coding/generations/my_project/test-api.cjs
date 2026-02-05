const http = require('http');

function testAPI(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`${method} ${path}: ${res.statusCode}`);
        if (body) {
          try {
            const parsed = JSON.parse(body);
            console.log('Response:', JSON.stringify(parsed, null, 2));
            resolve({ status: res.statusCode, data: parsed });
          } catch(e) {
            console.log('Response (raw):', body.substring(0, 200));
            resolve({ status: res.statusCode, data: body });
          }
        } else {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`${method} ${path}: ERROR - ${e.message}`);
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing Backend API...\n');

  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    await testAPI('GET', '/health');
    console.log('');

    // Test 2: Get conversations
    console.log('Test 2: Get Conversations');
    const convResult = await testAPI('GET', '/api/conversations');
    console.log('');

    // Test 3: Create a conversation
    console.log('Test 3: Create Conversation');
    const createResult = await testAPI('POST', '/api/conversations', {
      title: 'API Test Conversation'
    });
    const convId = createResult.data?.id;
    console.log('Created conversation ID:', convId);
    console.log('');

    if (!convId) {
      console.log('❌ Cannot proceed without conversation ID');
      return;
    }

    // Test 4: Try to send a message (non-streaming first)
    console.log('Test 4: Send Message (non-streaming endpoint)');
    try {
      await testAPI('POST', `/api/conversations/${convId}/messages`, {
        content: 'Hello, this is a test message'
      });
    } catch (e) {
      console.log('Note: This might fail if API key is not configured');
    }
    console.log('');

    console.log('✅ Basic API tests completed');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
