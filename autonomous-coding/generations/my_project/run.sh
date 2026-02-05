#!/bin/bash

# Quick start script - runs both frontend and backend

set -e

echo "Starting Claude.ai Clone..."
echo ""

# Run init first to ensure everything is set up
./init.sh

echo ""
echo "Starting servers..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start backend in background
cd server
node index.js &
BACKEND_PID=$!
cd ..

# Give backend time to start
sleep 2

# Start frontend in background
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "================================"
echo "Both servers are running!"
echo "================================"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
