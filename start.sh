#!/bin/bash

# DTCC Tracker Local Development Startup Script
# This script starts both the backend (Django) and frontend (Next.js) servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DTCC Tracker - Local Development${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"

    # Kill backend process if it exists
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Backend server stopped"
    fi

    # Kill frontend process if it exists
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Frontend server stopped"
    fi

    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Check for required tools
echo -e "${YELLOW}Checking requirements...${NC}"

if ! command_exists python3 && ! command_exists python; then
    echo -e "${RED}✗ Python is not installed. Please install Python 3.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed. Please install Node.js and npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} All requirements met"
echo ""

# Check if ports are already in use
if port_in_use 8000; then
    echo -e "${RED}✗ Port 8000 is already in use (Backend port)${NC}"
    echo -e "  Please stop the service using port 8000 or use a different port"
    exit 1
fi

if port_in_use 3000; then
    echo -e "${RED}✗ Port 3000 is already in use (Frontend port)${NC}"
    echo -e "  Please stop the service using port 3000 or use a different port"
    exit 1
fi

# Setup Backend
echo -e "${BLUE}Setting up Backend (Django)...${NC}"
cd "$SCRIPT_DIR/backend"

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv || python -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import django" 2>/dev/null; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Backend dependencies already installed"
fi

# Run migrations (always run to ensure database is ready)
echo -e "${YELLOW}Ensuring database is ready...${NC}"
python manage.py migrate --no-input 2>/dev/null || {
    echo -e "${YELLOW}Running database migrations...${NC}"
    python manage.py migrate
}
echo -e "${GREEN}✓${NC} Database is ready"

# Check if superuser exists (optional)
if ! python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exit(0 if User.objects.filter(is_superuser=True).exists() else 1)" 2>/dev/null; then
    echo ""
    echo -e "${YELLOW}No superuser found. Would you like to create one? (y/n)${NC}"
    read -r create_superuser
    if [[ $create_superuser =~ ^[Yy]$ ]]; then
        python manage.py createsuperuser
    fi
fi

# Start Backend Server
echo -e "${YELLOW}Starting backend server on http://127.0.0.1:8000/${NC}"
python manage.py runserver &
BACKEND_PID=$!
echo -e "${GREEN}✓${NC} Backend server started (PID: $BACKEND_PID)"
echo ""

# Setup Frontend
echo -e "${BLUE}Setting up Frontend (Next.js)...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found in frontend directory${NC}"
    echo -e "  Please ensure you're running this script from the project root"
    exit 1
fi

# Check if node_modules exists or if next is not installed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
    echo -e "${YELLOW}Installing frontend dependencies (this may take a few minutes)...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        echo -e "  Please check your npm/node installation and try again"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    # Verify next.js is actually installed
    if ! npx next --version >/dev/null 2>&1; then
        echo -e "${YELLOW}Next.js not found, reinstalling dependencies...${NC}"
        rm -rf node_modules package-lock.json
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
            echo -e "  Please check your npm/node installation and try again"
            exit 1
        fi
        echo -e "${GREEN}✓${NC} Frontend dependencies reinstalled"
    else
        echo -e "${GREEN}✓${NC} Frontend dependencies already installed"
    fi
fi

# Wait a moment for backend to fully start
sleep 2

# Start Frontend Server
echo -e "${YELLOW}Starting frontend server on http://localhost:3000/${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓${NC} Frontend server started (PID: $FRONTEND_PID)"
echo ""

# Display success message
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC} http://localhost:3000/"
echo -e "  ${BLUE}Backend:${NC}  http://127.0.0.1:8000/"
echo -e "  ${BLUE}Admin:${NC}    http://127.0.0.1:8000/admin/"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep the script running and show logs
echo -e "${BLUE}Showing server logs...${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID