#!/bin/bash

# Claude.ai Clone - Initialization Script
# This script sets up and runs the development environment

set -e  # Exit on any error

echo "================================"
echo "Claude.ai Clone - Setup & Start"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Error: Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}Installing pnpm...${NC}"
    npm install -g pnpm
fi

echo -e "${BLUE}Step 1: Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    pnpm install
else
    echo -e "${GREEN}Frontend dependencies already installed${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Setting up backend...${NC}"
if [ ! -d "server" ]; then
    echo -e "${YELLOW}Creating server directory...${NC}"
    mkdir -p server
fi

cd server

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Initializing backend package.json...${NC}"
    npm init -y
    npm install express better-sqlite3 @anthropic-ai/sdk cors dotenv
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}Backend dependencies already installed${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}Step 3: Checking API key configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    echo "VITE_ANTHROPIC_API_KEY=your_api_key_here" > .env
    echo -e "${YELLOW}Note: API key will be read from /tmp/api-key at runtime${NC}"
else
    echo -e "${GREEN}.env file exists${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Checking database setup...${NC}"
if [ ! -f "server/database.db" ]; then
    echo -e "${YELLOW}Database will be created on first server start${NC}"
else
    echo -e "${GREEN}Database file exists${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo -e "  1. Start the backend server:"
echo -e "     ${YELLOW}cd server && node index.js${NC}"
echo ""
echo -e "  2. In a new terminal, start the frontend:"
echo -e "     ${YELLOW}pnpm dev${NC}"
echo ""
echo -e "${BLUE}The application will be available at:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC} (or the port shown by Vite)"
echo -e "  Backend:  ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Quick start (runs both in parallel):${NC}"
echo -e "  ${YELLOW}./run.sh${NC}"
echo ""
