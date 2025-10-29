#!/bin/bash

# PostgreSQL setup script for DTCC Tracker
echo "Setting up PostgreSQL for DTCC Tracker..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Database configuration
DB_NAME="dtcc_tracker"
DB_USER="dtcc_user"
DB_PASSWORD="dtcc_password"

# Create user and database
echo "Creating PostgreSQL user and database..."

# Connect to PostgreSQL and create user/database
psql -U postgres <<EOF
-- Create user if not exists
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$do\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and create extensions
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For text search
CREATE EXTENSION IF NOT EXISTS btree_gin;  -- For better indexing
EOF

echo "PostgreSQL setup complete!"
echo ""
echo "Database created:"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "To use PostgreSQL in development, add these to your .env file:"
echo ""
echo "USE_POSTGRES_DEV=True"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo ""
echo "For production, use DATABASE_URL:"
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"