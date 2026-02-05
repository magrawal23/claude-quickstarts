const http = require('http');

function checkServer(port, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${name} is running on port ${port} (status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} is NOT running on port ${port} (${err.message})`);
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`❌ ${name} timed out on port ${port}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Checking servers...\n');
  const backend = await checkServer(3000, 'Backend');
  const frontend = await checkServer(5173, 'Frontend');

  console.log('\nSummary:');
  console.log(`Backend (port 3000): ${backend ? 'RUNNING' : 'NOT RUNNING'}`);
  console.log(`Frontend (port 5173): ${frontend ? 'RUNNING' : 'NOT RUNNING'}`);

  if (!backend || !frontend) {
    console.log('\n⚠️  One or more servers need to be started!');
    process.exit(1);
  } else {
    console.log('\n✅ All servers are running!');
    process.exit(0);
  }
}

main();
