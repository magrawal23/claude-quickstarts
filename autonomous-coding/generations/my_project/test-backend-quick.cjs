const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/conversations',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Backend is responding');
    console.log(`Conversations count: ${JSON.parse(data).length}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
