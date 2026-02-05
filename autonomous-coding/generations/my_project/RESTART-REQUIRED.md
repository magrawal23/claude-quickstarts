# Backend Restart Required

## Changes Made
- Added auto-generated conversation titles feature
- Modified `server/routes/messages.js` to generate titles after first message
- Backend must be restarted to pick up these changes

## How to Restart Backend

### Option 1: Using the running process
1. Find the node process running on port 3002:
   ```bash
   ps aux | grep "node.*server"
   ```

2. Kill it (replace PID with actual process ID):
   ```bash
   kill PID
   ```

3. Start new backend:
   ```bash
   PORT=3002 node server/index.js &
   ```

### Option 2: Using scripts
```bash
./restart-servers.sh
```

### Option 3: Manual restart
In the terminal where the backend is running:
1. Press Ctrl+C to stop it
2. Run: `PORT=3002 node server/index.js`

## Verification
Once restarted, test by:
1. Creating a new conversation
2. Sending a message
3. The conversation title should automatically update from "New Conversation" to something relevant

Run the test script:
```bash
node test-title-generation.cjs
```
