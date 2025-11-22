# DTCC Tracker - Ubuntu 22.04 Native Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Installation](#installation)
4. [Post-Installation](#post-installation)
5. [Service Management](#service-management)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Prerequisites

### AWS Account Requirements
- AWS account with EC2 access
- Domain name (configured in Route 53 or external DNS)
- SSL certificate (Let's Encrypt - automated in setup)

### Recommended EC2 Instance
- **Type**: t3.medium (minimum) or t3.large (recommended)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 30GB+ gp3 SSD
- **RAM**: 4GB minimum, 8GB recommended
- **vCPUs**: 2 minimum, 4 recommended
- **Security Group Ports**:
  - SSH (22) - Your IP only
  - HTTP (80) - All (redirects to HTTPS)
  - HTTPS (443) - All

## AWS EC2 Setup

### 1. Launch EC2 Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c94855ba95c574c8 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxxx \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=dtcc-tracker-prod}]' \
  --user-data file://user-data.sh
```

### 2. Configure Security Group

```bash
# Create security group
aws ec2 create-security-group \
  --group-name dtcc-tracker-sg \
  --description "Security group for DTCC Tracker"

# Allow SSH from your IP
aws ec2 authorize-security-group-ingress \
  --group-name dtcc-tracker-sg \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32

# Allow HTTP
aws ec2 authorize-security-group-ingress \
  --group-name dtcc-tracker-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name dtcc-tracker-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### 3. Attach Elastic IP

```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text

# Associate with instance
aws ec2 associate-address \
  --instance-id i-xxxxx \
  --allocation-id eipalloc-xxxxx
```

### 4. Configure DNS
Point your domain to the Elastic IP in your DNS provider (Route 53 or external).

## Installation

### Automated Installation (Recommended)

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-elastic-ip

# Download and run installation script
wget https://raw.githubusercontent.com/your-repo/dtcc-tracker/main/scripts/aws-install.sh
chmod +x aws-install.sh

# Run with your domain and email
sudo ./aws-install.sh your-domain.com admin@your-domain.com

# The script will:
# - Install all dependencies (PostgreSQL 15, Redis 7, Python 3.11, Node.js 18, Nginx)
# - Configure systemd services with security hardening
# - Set up SSL with Let's Encrypt
# - Configure firewall and fail2ban
# - Create automated backups
# - Generate secure passwords
```

### Manual Installation (Advanced)

If you prefer manual control, follow these steps:

#### 1. System Update and Base Packages

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    build-essential \
    curl \
    wget \
    git \
    vim \
    htop \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    supervisor
```

#### 2. Install PostgreSQL 15

```bash
# Add PostgreSQL APT repository
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Configure PostgreSQL
sudo -u postgres psql << EOF
CREATE USER dtcc_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE dtcc_tracker OWNER dtcc_user;
GRANT ALL PRIVILEGES ON DATABASE dtcc_tracker TO dtcc_user;
\c dtcc_tracker
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
EOF

# Optimize PostgreSQL (edit postgresql.conf)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Add performance settings from the installation script
```

#### 3. Install Redis 7

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis with password
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

#### 4. Install Python 3.11

```bash
# Add deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
```

#### 5. Install Node.js 18

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs
```

#### 6. Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

#### 7. Create Application User

```bash
# Create user for application
sudo useradd -m -s /bin/bash dtcc
sudo usermod -aG www-data dtcc

# Create directories
sudo mkdir -p /var/www/dtcc-tracker
sudo mkdir -p /var/log/dtcc
sudo mkdir -p /var/run/dtcc
sudo mkdir -p /var/backups/dtcc

# Set permissions
sudo chown -R dtcc:dtcc /var/www/dtcc-tracker
sudo chown -R dtcc:dtcc /var/log/dtcc
sudo chown -R dtcc:dtcc /var/run/dtcc
sudo chown -R dtcc:dtcc /var/backups/dtcc
```

#### 8. Clone Repository

```bash
# Clone your repository
cd /var/www/dtcc-tracker
sudo -u dtcc git clone https://github.com/your-repo/dtcc-tracker.git .
```

#### 9. Setup Python Virtual Environment

```bash
# Create virtual environment
sudo -u dtcc python3.11 -m venv venv

# Activate and install dependencies
sudo -u dtcc bash -c "source venv/bin/activate && pip install --upgrade pip"
sudo -u dtcc bash -c "source venv/bin/activate && pip install -r backend/requirements.txt"
sudo -u dtcc bash -c "source venv/bin/activate && pip install gunicorn"
```

#### 10. Configure Backend

```bash
# Create .env file
sudo -u dtcc nano /var/www/dtcc-tracker/backend/.env
# Add all required environment variables (see .env.production template)

# Run migrations
sudo -u dtcc bash -c "cd backend && source ../venv/bin/activate && python manage.py migrate"
sudo -u dtcc bash -c "cd backend && source ../venv/bin/activate && python manage.py collectstatic --noinput"

# Create superuser
sudo -u dtcc bash -c "cd backend && source ../venv/bin/activate && python manage.py createsuperuser"
```

#### 11. Build Frontend

```bash
# Install dependencies and build
cd /var/www/dtcc-tracker/frontend
sudo -u dtcc npm ci --production
sudo -u dtcc npm run build
```

#### 12. Install systemd Services

```bash
# Copy systemd service files
sudo cp /var/www/dtcc-tracker/systemd/*.service /etc/systemd/system/
sudo cp /var/www/dtcc-tracker/systemd/*.timer /etc/systemd/system/
sudo cp /var/www/dtcc-tracker/systemd/*.target /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable dtcc-tracker.target
sudo systemctl enable dtcc-backend.service
sudo systemctl enable dtcc-celery.service
sudo systemctl enable dtcc-celery-beat.service
sudo systemctl enable dtcc-frontend.service
sudo systemctl enable dtcc-backup.timer

# Start services
sudo systemctl start dtcc-tracker.target
```

#### 13. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/dtcc-tracker/nginx/sites-enabled/dtcc.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/dtcc.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 14. Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com \
  --non-interactive --agree-tos --email admin@your-domain.com --redirect

# Auto-renewal is configured automatically
sudo systemctl status snap.certbot.renew.timer
```

## Post-Installation

### 1. Configure Firewall

```bash
# Setup UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable
```

### 2. Configure fail2ban

```bash
# Create jail configuration
sudo nano /etc/fail2ban/jail.local
# Add configuration from installation script

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 3. Verify Services

```bash
# Check all services
sudo systemctl status dtcc-*

# Check individual services
sudo systemctl status dtcc-backend
sudo systemctl status dtcc-frontend
sudo systemctl status dtcc-celery
sudo systemctl status dtcc-celery-beat
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# Check logs
sudo journalctl -u dtcc-backend -f
sudo journalctl -u dtcc-frontend -f
```

### 4. Test Application

```bash
# Test health endpoint
curl https://your-domain.com/api/health/

# Test frontend
curl -I https://your-domain.com/

# Check SSL
curl -vI https://your-domain.com/ 2>&1 | grep -A 5 "SSL connection"
```

## Service Management

### Start/Stop Services

```bash
# Start all services
sudo systemctl start dtcc-tracker.target

# Stop all services
sudo systemctl stop dtcc-tracker.target

# Restart individual service
sudo systemctl restart dtcc-backend

# View service logs
sudo journalctl -u dtcc-backend -f
sudo journalctl -u dtcc-frontend -f
```

### Update Application

```bash
# Pull latest code
cd /var/www/dtcc-tracker
sudo -u dtcc git pull origin main

# Update backend
sudo -u dtcc bash -c "source venv/bin/activate && pip install -r backend/requirements.txt"
sudo -u dtcc bash -c "cd backend && source ../venv/bin/activate && python manage.py migrate"
sudo -u dtcc bash -c "cd backend && source ../venv/bin/activate && python manage.py collectstatic --noinput"

# Update frontend
cd frontend
sudo -u dtcc npm ci --production
sudo -u dtcc npm run build

# Restart services
sudo systemctl restart dtcc-tracker.target
```

## Monitoring & Maintenance

### Daily Tasks

```bash
# Check service health
systemctl status dtcc-* --no-pager

# Check disk usage
df -h

# Check memory
free -m

# View recent logs
journalctl --since "1 hour ago" -u dtcc-backend
```

### Weekly Tasks

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Check for security updates
sudo unattended-upgrades --dry-run

# Review backup status
ls -lah /var/backups/dtcc/
```

### Monthly Tasks

```bash
# SSL certificate check (auto-renews)
sudo certbot renew --dry-run

# Database maintenance
sudo -u postgres vacuumdb --all --analyze

# Log rotation check
sudo logrotate -f /etc/logrotate.conf

# Clean old backups (keep last 30 days)
find /var/backups/dtcc -type f -mtime +30 -delete
```

## Troubleshooting

### Common Issues

#### 502 Bad Gateway

```bash
# Check backend service
sudo systemctl status dtcc-backend
sudo journalctl -u dtcc-backend -n 100

# Check socket file
ls -la /var/www/dtcc-tracker/backend/gunicorn.sock

# Restart services
sudo systemctl restart dtcc-backend nginx
```

#### Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1"

# Test connection
sudo -u dtcc bash -c "cd /var/www/dtcc-tracker/backend && source ../venv/bin/activate && python manage.py dbshell"
```

#### Redis Connection Error

```bash
# Check Redis
sudo systemctl status redis
redis-cli -a your_password ping

# Check Redis memory
redis-cli -a your_password INFO memory
```

#### Frontend Not Loading

```bash
# Check frontend service
sudo systemctl status dtcc-frontend
sudo journalctl -u dtcc-frontend -n 100

# Rebuild frontend
cd /var/www/dtcc-tracker/frontend
sudo -u dtcc npm run build
sudo systemctl restart dtcc-frontend
```

### Performance Issues

```bash
# Check system resources
htop

# Check slow queries (PostgreSQL)
sudo -u postgres psql -d dtcc_tracker -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Clear Redis cache
redis-cli -a your_password FLUSHALL

# Restart all services
sudo systemctl restart dtcc-tracker.target
```

## Security Best Practices

### 1. Regular Updates

```bash
# Enable automatic security updates
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Manual update check
sudo apt update && sudo apt upgrade
```

### 2. Backup Strategy

```bash
# Verify backup timer is running
systemctl status dtcc-backup.timer

# Manual backup
sudo systemctl start dtcc-backup.service

# Configure S3 backup (optional)
aws configure
# Add S3 sync to backup script
```

### 3. Monitoring

```bash
# Install monitoring agent (optional)
# CloudWatch
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Or Datadog
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=your_api_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

### 4. Security Hardening

```bash
# Disable root SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

# Install and configure auditd
sudo apt install auditd
sudo systemctl enable auditd

# Configure AppArmor profiles
sudo aa-enforce /etc/apparmor.d/*
```

### 5. SSL/TLS Best Practices

```bash
# Test SSL configuration
curl -s https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Update Nginx SSL configuration for A+ rating
sudo nano /etc/nginx/sites-available/dtcc.conf
# Add strong ciphers and protocols
```

## CI/CD Integration

### GitHub Actions Secrets

Add these secrets to your GitHub repository:

```yaml
AWS_PRIVATE_KEY     # EC2 SSH private key
AWS_HOSTNAME        # Your domain or Elastic IP
AWS_USERNAME        # ubuntu
PRODUCTION_URL      # https://your-domain.com
SLACK_WEBHOOK       # Optional: Slack notifications
BACKUP_BUCKET       # Optional: S3 backup bucket
```

### Deployment Workflow

The CI/CD pipeline will:
1. Run tests on push to main branch
2. Create deployment package
3. Copy to EC2 via SCP
4. Extract and update code
5. Run migrations
6. Rebuild frontend
7. Restart services
8. Run smoke tests
9. Rollback on failure

## Support and Logs

### Log Locations

- **Application Logs**: `/var/log/dtcc/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`
- **System Logs**: `/var/log/syslog`
- **Journal Logs**: `journalctl -u service-name`

### Getting Help

1. Check service status: `systemctl status dtcc-*`
2. Review logs: `journalctl -u dtcc-backend -n 100`
3. Check documentation: `/var/www/dtcc-tracker/docs/`
4. GitHub Issues: https://github.com/your-repo/dtcc-tracker/issues

---

**Last Updated**: October 29, 2025
**Version**: 2.0.0 (Ubuntu Native)
**No Docker Dependencies**: This deployment uses native Ubuntu 22.04 services only