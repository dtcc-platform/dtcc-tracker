#!/bin/bash

# DTCC Tracker - AWS EC2 Installation Script for Ubuntu 22.04
# This script sets up a complete production environment on a fresh EC2 instance

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN_NAME=${1:-"dtcc.example.com"}
ADMIN_EMAIL=${2:-"admin@example.com"}
DB_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}DTCC Tracker - AWS EC2 Installation Script${NC}"
echo -e "${GREEN}Ubuntu 22.04 LTS${NC}"
echo -e "${GREEN}================================================${NC}"

# Function to print colored messages
log_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error_message() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_message "This script must be run as root or with sudo"
fi

# Update system
log_message "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential packages
log_message "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    build-essential \
    software-properties-common \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    supervisor \
    unzip

# Install Python 3.11
log_message "Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt-get update
apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
log_message "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL 15
log_message "Installing PostgreSQL 15..."
sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Configure PostgreSQL
log_message "Configuring PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER dtcc_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE dtcc_tracker OWNER dtcc_user;
GRANT ALL PRIVILEGES ON DATABASE dtcc_tracker TO dtcc_user;
ALTER USER dtcc_user CREATEDB;
\c dtcc_tracker
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
EOF

# Update PostgreSQL configuration for performance
cat >> /etc/postgresql/15/main/postgresql.conf <<EOF

# Performance Tuning
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
max_parallel_maintenance_workers = 2
EOF

systemctl restart postgresql

# Install Redis
log_message "Installing Redis..."
apt-get install -y redis-server

# Configure Redis with password
log_message "Configuring Redis..."
cat > /etc/redis/redis.conf <<EOF
bind 127.0.0.1
port 6379
requirepass $REDIS_PASSWORD
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfilename "appendonly.aof"
EOF

systemctl restart redis-server
systemctl enable redis-server

# Install Nginx
log_message "Installing Nginx..."
apt-get install -y nginx

# Configure UFW firewall
log_message "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Configure fail2ban
log_message "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# Create application user
log_message "Creating application user..."
useradd -m -s /bin/bash dtcc || true
usermod -aG sudo dtcc

# Create application directory
log_message "Creating application directory..."
mkdir -p /var/www/dtcc-tracker
chown -R dtcc:dtcc /var/www/dtcc-tracker

# Clone repository (or copy files)
log_message "Setting up application files..."
cd /var/www/dtcc-tracker

# If repository URL is provided, clone it
if [ ! -z "$REPO_URL" ]; then
    git clone $REPO_URL .
else
    log_message "Please copy your application files to /var/www/dtcc-tracker"
fi

# Create virtual environment
log_message "Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
log_message "Installing Python dependencies..."
cd /var/www/dtcc-tracker/backend
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Create production .env file
log_message "Creating production environment file..."
cat > /var/www/dtcc-tracker/backend/.env <<EOF
# Django Settings
SECRET_KEY=$SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=$DOMAIN_NAME,www.$DOMAIN_NAME,$( hostname -I | awk '{print $1}' )

# Database
DATABASE_URL=postgresql://dtcc_user:$DB_PASSWORD@localhost:5432/dtcc_tracker

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://:$REDIS_PASSWORD@localhost:6379/0
CELERY_RESULT_BACKEND=redis://:$REDIS_PASSWORD@localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME

# Email (configure with your SMTP settings)
DEFAULT_FROM_EMAIL=noreply@$DOMAIN_NAME
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# JWT Settings
ACCESS_TOKEN_LIFETIME_MINUTES=15
REFRESH_TOKEN_LIFETIME_DAYS=7
EOF

# Run Django migrations
log_message "Running database migrations..."
cd /var/www/dtcc-tracker/backend
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

# Create superuser
log_message "Creating Django superuser..."
cat <<EOF | python manage.py shell
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', '$ADMIN_EMAIL', 'ChangeMe123!')
    print('Superuser created: admin / ChangeMe123!')
else:
    print('Superuser already exists')
EOF

# Build frontend
log_message "Building frontend..."
cd /var/www/dtcc-tracker/frontend
npm ci
npm run build

# Create systemd service for Django/Gunicorn
log_message "Creating systemd services..."
cat > /etc/systemd/system/dtcc-backend.service <<EOF
[Unit]
Description=DTCC Tracker Backend
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=dtcc
Group=dtcc
WorkingDirectory=/var/www/dtcc-tracker/backend
Environment="PATH=/var/www/dtcc-tracker/venv/bin"
ExecStart=/var/www/dtcc-tracker/venv/bin/gunicorn \
    --workers 3 \
    --worker-class sync \
    --bind unix:/var/www/dtcc-tracker/backend/gunicorn.sock \
    --access-logfile /var/log/dtcc/access.log \
    --error-logfile /var/log/dtcc/error.log \
    --log-level info \
    backend_paper.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Celery
cat > /etc/systemd/system/dtcc-celery.service <<EOF
[Unit]
Description=DTCC Tracker Celery Worker
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=dtcc
Group=dtcc
WorkingDirectory=/var/www/dtcc-tracker/backend
Environment="PATH=/var/www/dtcc-tracker/venv/bin"
ExecStart=/var/www/dtcc-tracker/venv/bin/celery \
    -A backend_paper worker \
    --loglevel=info \
    --logfile=/var/log/dtcc/celery.log \
    --detach

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Celery Beat
cat > /etc/systemd/system/dtcc-celery-beat.service <<EOF
[Unit]
Description=DTCC Tracker Celery Beat
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=dtcc
Group=dtcc
WorkingDirectory=/var/www/dtcc-tracker/backend
Environment="PATH=/var/www/dtcc-tracker/venv/bin"
ExecStart=/var/www/dtcc-tracker/venv/bin/celery \
    -A backend_paper beat \
    --loglevel=info \
    --logfile=/var/log/dtcc/celery-beat.log

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Next.js frontend
cat > /etc/systemd/system/dtcc-frontend.service <<EOF
[Unit]
Description=DTCC Tracker Frontend
After=network.target

[Service]
Type=simple
User=dtcc
Group=dtcc
WorkingDirectory=/var/www/dtcc-tracker/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
mkdir -p /var/log/dtcc
chown -R dtcc:dtcc /var/log/dtcc

# Configure Nginx
log_message "Configuring Nginx..."
cat > /etc/nginx/sites-available/dtcc-tracker <<EOF
upstream backend {
    server unix:/var/www/dtcc-tracker/backend/gunicorn.sock;
}

upstream frontend {
    server localhost:3000;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone \$binary_remote_addr zone=api:10m rate=100r/m;

server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Logging
    access_log /var/log/nginx/dtcc-access.log;
    error_log /var/log/nginx/dtcc-error.log;

    # Max upload size
    client_max_body_size 10M;

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin endpoints
    location /admin/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/dtcc-tracker/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/dtcc-tracker/backend/media/;
        expires 7d;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/dtcc-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Set proper permissions
chown -R dtcc:dtcc /var/www/dtcc-tracker

# Enable and start services
log_message "Starting services..."
systemctl daemon-reload
systemctl enable dtcc-backend dtcc-celery dtcc-celery-beat dtcc-frontend
systemctl start dtcc-backend dtcc-celery dtcc-celery-beat dtcc-frontend

# Get SSL certificate
log_message "Getting SSL certificate..."
certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect

# Create backup script
log_message "Creating backup script..."
cat > /var/www/dtcc-tracker/scripts/backup.sh <<'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="/var/backups/dtcc"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U dtcc_user -h localhost dtcc_tracker | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup media files
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/dtcc-tracker/backend/media/

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/
BACKUP_SCRIPT

chmod +x /var/www/dtcc-tracker/scripts/backup.sh

# Add cron job for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/dtcc-tracker/scripts/backup.sh") | crontab -

# Create monitoring script
log_message "Creating monitoring script..."
cat > /var/www/dtcc-tracker/scripts/monitor.sh <<'MONITOR_SCRIPT'
#!/bin/bash
# Health check script

# Check if services are running
services=("nginx" "postgresql" "redis-server" "dtcc-backend" "dtcc-celery" "dtcc-frontend")

for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "$service is running"
    else
        echo "WARNING: $service is not running"
        systemctl restart $service
    fi
done

# Check disk space
df -h | grep -E '^/dev/' | awk '{ if(int($5) > 80) print "WARNING: " $1 " is " $5 " full" }'

# Check memory usage
free -m | awk 'NR==2{printf "Memory Usage: %s/%sMB (%.2f%%)\n", $3,$2,$3*100/$2 }'
MONITOR_SCRIPT

chmod +x /var/www/dtcc-tracker/scripts/monitor.sh

# Add monitoring to cron
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/dtcc-tracker/scripts/monitor.sh > /var/log/dtcc/monitor.log 2>&1") | crontab -

# Print summary
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Important Information:${NC}"
echo "Domain: https://$DOMAIN_NAME"
echo "Admin URL: https://$DOMAIN_NAME/admin/"
echo "Admin Username: admin"
echo "Admin Password: ChangeMe123! (PLEASE CHANGE THIS!)"
echo ""
echo -e "${YELLOW}Database Credentials:${NC}"
echo "Database Name: dtcc_tracker"
echo "Database User: dtcc_user"
echo "Database Password: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}Redis Password:${NC} $REDIS_PASSWORD"
echo ""
echo -e "${YELLOW}Service Status:${NC}"
systemctl status dtcc-backend --no-pager | head -n 3
systemctl status dtcc-frontend --no-pager | head -n 3
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Change the admin password immediately"
echo "2. Update EMAIL settings in /var/www/dtcc-tracker/backend/.env"
echo "3. Configure backup destination (S3, etc.)"
echo "4. Set up monitoring alerts"
echo "5. Review security settings"
echo ""
echo -e "${GREEN}Logs are available at:${NC}"
echo "- Application: /var/log/dtcc/"
echo "- Nginx: /var/log/nginx/"
echo "- PostgreSQL: /var/log/postgresql/"
echo ""
echo -e "${GREEN}To check all services:${NC}"
echo "systemctl status dtcc-*"
echo ""
echo -e "${GREEN}Installation log saved to: /var/log/dtcc-install.log${NC}"