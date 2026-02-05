const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function deleteShare() {
  const result = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/conversations/124/share',
    method: 'DELETE'
  });
  console.log(`Delete result: ${result.status}`);
  console.log(result.data);
}

deleteShare();
