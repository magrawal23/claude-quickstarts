#!/bin/bash

# Restart both frontend and backend servers

echo "Restarting servers..."

# Kill existing node processes (frontend and backend)
ps aux | grep "node" | grep -v grep | while read line; do
  pid=$(echo $line | cut -d' ' -f2)
  taskkill //PID $pid //F 2>/dev/null || true
done

sleep 2

# Start backend server in background
echo "Starting backend..."
PATH="/c/Program Files/nodejs:$PATH" node server/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

# Start frontend server in background
echo "Starting frontend..."
PATH="/c/Program Files/nodejs:$PATH" npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

sleep 3

echo ""
echo "✅ Servers restarted!"
echo "Backend: http://localhost:3000 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Logs:"
echo "  Backend: backend.log"
echo "  Frontend: frontend.log"
