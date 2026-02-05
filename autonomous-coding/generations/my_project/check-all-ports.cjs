const http = require('http');

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log(`Port ${port}: ✅ RUNNING (${data.status}) - ${data.timestamp}`);
          resolve(true);
        } catch (e) {
          console.log(`Port ${port}: ✅ RUNNING (but not /health endpoint)`);
          resolve(true);
        }
      });
    });

    req.on('error', () => {
      console.log(`Port ${port}: ❌ NOT RUNNING`);
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`Port ${port}: ❌ TIMEOUT`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Checking which backend ports are running...\n');

  for (let port = 3000; port <= 3005; port++) {
    await checkPort(port);
  }

  console.log('\nChecking frontend ports...\n');

  for (let port = 5173; port <= 5176; port++) {
    await checkPort(port);
  }
}

main();
