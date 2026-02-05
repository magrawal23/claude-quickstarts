const { spawn, exec } = require('child_process');
const http = require('http');

// Check if port 3002 is in use
function checkPort() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3002/health', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('Checking if backend is running on port 3002...');

  const isRunning = await checkPort();

  if (isRunning) {
    console.log('✅ Backend is already running on port 3002');
    console.log('⚠️  Backend needs to be restarted to pick up code changes');
    console.log('   Please manually restart the backend server');
    console.log('   You can kill the process and run:');
    console.log('   PORT=3002 node server/index.js');
  } else {
    console.log('Backend not running, starting it now...');

    // Start backend
    const backend = spawn('node', ['server/index.js'], {
      env: { ...process.env, PORT: '3002' },
      detached: false,
      stdio: 'inherit'
    });

    console.log(`Started backend with PID: ${backend.pid}`);

    // Wait a bit and check
    setTimeout(async () => {
      const running = await checkPort();
      if (running) {
        console.log('✅ Backend started successfully on port 3002');
      } else {
        console.log('❌ Backend failed to start');
      }
      process.exit(0);
    }, 3000);
  }
}

main();
