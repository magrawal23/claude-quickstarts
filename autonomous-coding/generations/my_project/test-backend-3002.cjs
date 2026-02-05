const http = require('http');

function testAPI(port, method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('Testing Backend on Port 3002 (FIXED version)...\n');

  console.log('Test: Create Conversation');
  const result = await testAPI(3002, 'POST', '/api/conversations', {
    title: 'Port 3002 Test Conversation'
  });

  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data && result.data.id) {
    console.log('\n✅ SUCCESS! Backend on 3002 is working with the FIX!');
    console.log('Conversation ID:', result.data.id);
  } else {
    console.log('\n❌ Something is wrong');
  }
}

runTests();
