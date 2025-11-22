#!/bin/bash

# Redis setup script for DTCC Tracker
echo "Setting up Redis for DTCC Tracker..."

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "Redis is not installed. Please install it first:"
    echo "  macOS: brew install redis"
    echo "  Ubuntu: sudo apt-get install redis-server"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "Starting Redis server..."

    # Try to start Redis based on the OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start redis
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start redis-server
    else
        # Generic start
        redis-server --daemonize yes
    fi

    # Wait for Redis to start
    sleep 2

    # Check again
    if ! redis-cli ping &> /dev/null; then
        echo "Failed to start Redis. Please start it manually."
        exit 1
    fi
fi

echo "Redis is running!"

# Configure Redis for production use
echo "Configuring Redis..."

# Create Redis configuration for DTCC Tracker
redis-cli <<EOF
# Set max memory policy
CONFIG SET maxmemory-policy allkeys-lru

# Set max memory to 256MB (adjust as needed)
CONFIG SET maxmemory 256mb

# Enable persistence
CONFIG SET save "900 1 300 10 60 10000"

# Save configuration
CONFIG REWRITE
EOF

echo "Redis configuration complete!"
echo ""
echo "Redis Status:"
redis-cli INFO server | grep redis_version
redis-cli INFO memory | grep used_memory_human

echo ""
echo "Testing Redis connection..."
redis-cli SET test_key "DTCC Tracker Redis Test"
TEST_VALUE=$(redis-cli GET test_key)
redis-cli DEL test_key

if [ "$TEST_VALUE" = "DTCC Tracker Redis Test" ]; then
    echo "✅ Redis connection test successful!"
else
    echo "❌ Redis connection test failed!"
    exit 1
fi

echo ""
echo "Redis is configured and ready for use!"
echo ""
echo "Redis Connection Details:"
echo "  Host: localhost"
echo "  Port: 6379"
echo "  Database: 0"
echo ""
echo "To use Redis in your .env file:"
echo "  REDIS_URL=redis://localhost:6379/0"
echo "  CELERY_BROKER_URL=redis://localhost:6379/0"
echo "  CELERY_RESULT_BACKEND=redis://localhost:6379/0"