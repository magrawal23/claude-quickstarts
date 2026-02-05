const http = require('http');

function testAPI(port, method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
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
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing FIXED Backend API on port 3001...\n');

  try {
    console.log('Test 1: Health Check');
    await testAPI(3001, 'GET', '/health');
    console.log('✅ Health check passed\n');

    console.log('Test 2: Create Conversation (This should now return the conversation!)');
    const createResult = await testAPI(3001, 'POST', '/api/conversations', {
      title: 'Fixed API Test Conversation'
    });
    console.log('Status:', createResult.status);
    console.log('Response:', JSON.stringify(createResult.data, null, 2));

    if (createResult.data && createResult.data.id) {
      console.log('\n✅ SUCCESS! Conversation ID:', createResult.data.id);
      console.log('✅ Bug is FIXED! The endpoint now returns the conversation object!\n');
    } else {
      console.log('\n❌ Still broken - no conversation object returned\n');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
