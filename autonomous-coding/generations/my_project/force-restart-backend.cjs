const { exec, spawn } = require('child_process');
const http = require('http');

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    // On Windows, use netstat to find PID
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout) {
        console.log(`No process found on port ${port}`);
        resolve(false);
        return;
      }

      const lines = stdout.trim().split('\n');
      const pids = new Set();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }

      if (pids.size === 0) {
        console.log(`No PID found for port ${port}`);
        resolve(false);
        return;
      }

      console.log(`Found PIDs on port ${port}:`, Array.from(pids).join(', '));

      // Kill each PID
      let killed = 0;
      for (const pid of pids) {
        exec(`taskkill /F /PID ${pid}`, (err) => {
          if (!err) {
            console.log(`✅ Killed process ${pid}`);
            killed++;
          }
          if (killed === pids.size) {
            resolve(true);
          }
        });
      }
    });
  });
}

async function startBackend(port) {
  console.log(`Starting backend on port ${port}...`);

  const backend = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: port.toString() },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backend.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backend.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backend.unref(); // Allow parent to exit

  console.log(`Backend started with PID: ${backend.pid}`);

  // Wait and verify
  await new Promise(resolve => setTimeout(resolve, 3000));

  const running = await checkPort(port);
  if (running) {
    console.log(`✅ Backend is running on port ${port}`);
    return true;
  } else {
    console.log(`❌ Backend failed to start on port ${port}`);
    return false;
  }
}

async function main() {
  console.log('=== BACKEND RESTART SCRIPT ===\n');

  const port = 3002;

  // Check if backend is running
  console.log(`Checking port ${port}...`);
  const isRunning = await checkPort(port);

  if (isRunning) {
    console.log(`Backend is running on port ${port}, killing it...`);
    await killProcessOnPort(port);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`Port ${port} is free`);
  }

  // Start backend
  const success = await startBackend(port);

  if (success) {
    console.log('\n✅ Backend restart complete!');
    console.log('You can now test the title generation feature.');
  } else {
    console.log('\n❌ Failed to restart backend');
    console.log('Please check the logs and try manual restart');
  }
}

main().catch(console.error);
