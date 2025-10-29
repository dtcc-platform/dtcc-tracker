#!/bin/bash

# DTCC Tracker - Stop Services Script
# This script stops both the backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Stopping DTCC Tracker Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $service on port $port...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓${NC} $service stopped"
    else
        echo -e "${YELLOW}○${NC} $service not running on port $port"
    fi
}

# Stop backend server (Django on port 8000)
kill_port 8000 "Backend server"

# Stop frontend server (Next.js on port 3000)
kill_port 3000 "Frontend server"

echo ""
echo -e "${GREEN}All services stopped successfully!${NC}"