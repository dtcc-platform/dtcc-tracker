# DTCC Tracker - EC2 Deployment Guide

## Overview

This project uses GitHub Actions for automated CI/CD deployment to AWS EC2. The deployment workflow handles both the Django backend and Next.js frontend applications.

### SSL/HTTPS Options

1. **Custom SSL Certificate** (e.g., from Harica, Sectigo, etc.)
   - Use your own SSL certificate from any CA
   - Direct installation on Nginx
   - Full control over certificate management
   - See [Custom SSL Certificate Guide](nginx/CUSTOM-SSL-SETUP.md)

2. **Let's Encrypt** (Free)
   - Free SSL certificates
   - Auto-renewal every 90 days
   - Quick setup with provided script
   - See SSL/HTTPS Configuration section below

3. **CloudFront + ACM** (Optional)
   - For CDN caching and ACM certificate usage
   - See [CloudFront Setup Guide](nginx/CLOUDFRONT-SETUP.md)

## Architecture

- **Backend**: Django (localhost:8000) managed by systemd with Gunicorn
- **Frontend**: Next.js (localhost:3000) managed by systemd
- **Reverse Proxy**: Nginx serving on ports 80 (HTTP) and 443 (HTTPS)
- **SSL/HTTPS**: Custom certificate or Let's Encrypt
- **Deployment**: GitHub Actions with SSH deployment
- **Process Management**: systemd services

### Request Flow

```
Client Request (HTTP/HTTPS)
    ↓
Nginx (Port 80/443 with SSL)
    ↓
├── /api/* → Django Backend (localhost:8000)
├── /admin/* → Django Backend (localhost:8000)
├── /static/* → Django Static Files
├── /media/* → Django Media Files
└── /* → Next.js Frontend (localhost:3000)
```

## Prerequisites

### 1. EC2 Instance Setup

Ensure your EC2 instance has:
- Ubuntu/Debian-based Linux
- Python 3.11 or Python 3
- Node.js and npm
- Git installed
- Systemd (standard on modern Linux distributions)

Install required packages:
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3-pip nodejs npm git
```

### 2. GitHub Secrets Configuration

Configure the following secrets in your GitHub repository (Settings > Secrets and variables > Actions):

Required secrets:
- `EC2_SSH_PRIVATE_KEY`: Your EC2 instance's SSH private key
- `EC2_HOST`: EC2 instance public IP or hostname
- `EC2_USER`: SSH user (typically `ubuntu`)
- `SECRET_KEY`: Django secret key for production
- `DATABASE_URL`: Database connection string (e.g., `sqlite:///./db.sqlite3` or PostgreSQL URL)
- `NEXT_PUBLIC_API_URL`: Frontend API URL (e.g., `http://your-domain:8000`)

### 3. EC2 Security Group

Ensure your EC2 security group allows inbound traffic on:
- **Port 22** (SSH) - Restrict to your IP address for security
- **Port 80** (HTTP) - Public access (0.0.0.0/0)
- **Port 443** (HTTPS) - Public access (0.0.0.0/0)

**Note**: Ports 8000 and 3000 are NOT exposed publicly. They only listen on localhost and are accessed through Nginx reverse proxy for better security.

#### AWS Security Group Configuration

```json
{
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 22,
      "ToPort": 22,
      "IpRanges": [{"CidrIp": "YOUR_IP/32", "Description": "SSH from your IP"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTP"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 443,
      "ToPort": 443,
      "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTPS"}]
    }
  ]
}
```

#### AWS CLI Commands

```bash
# Add SSH rule (replace YOUR_IP and sg-xxxxxxxxx)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr YOUR_IP/32

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

## Deployment Workflow

The workflow (`.github/workflows/deploy-ec2.yml`) is triggered:
- On push to the `main` branch
- Manually via workflow_dispatch

### Workflow Steps

1. **Checkout code**: Pulls the latest code from the repository
2. **SSH to EC2**: Connects to EC2 using the configured SSH key
3. **Clone/Pull repository**: Initializes or updates the git repository on EC2
4. **Backend Deployment**:
   - Creates Python virtual environment
   - Installs dependencies from requirements.txt
   - Runs database migrations
   - Collects static files
   - Copies systemd service file if needed
   - Restarts backend service (binds to 127.0.0.1:8000)
5. **Frontend Deployment**:
   - Installs Node dependencies
   - Builds Next.js production bundle
   - Copies systemd service file if needed
   - Restarts frontend service (binds to 127.0.0.1:3000)
6. **Nginx Configuration**:
   - Installs Nginx if not present
   - Copies Nginx configuration
   - Creates symlink in sites-enabled
   - Tests configuration
   - Reloads Nginx

## Systemd Services

### Backend Service

File: `backend/dtcc-tracker-backend.service`

The backend runs using Gunicorn with:
- 3 worker processes
- Binding to 127.0.0.1:8000 (localhost only, accessed via Nginx)
- 120s timeout
- Automatic restart on failure

Logs:
- Access: `/var/log/dtcc-tracker-backend-access.log`
- Error: `/var/log/dtcc-tracker-backend-error.log`

### Frontend Service

File: `frontend/dtcc-tracker-frontend.service`

The frontend runs using Next.js production server:
- Port 3000
- NODE_ENV=production
- Automatic restart on failure

Logs:
- Output: `/var/log/dtcc-tracker-frontend.log`
- Error: `/var/log/dtcc-tracker-frontend-error.log`

### Nginx Service

File: `nginx/dtcc-tracker.conf`

Nginx acts as a reverse proxy with:
- HTTP on port 80
- HTTPS on port 443 (when SSL is configured)
- Routes `/api/*` and `/admin/*` to backend
- Routes static/media files directly
- Routes all other requests to frontend
- Security headers (HSTS, X-Content-Type-Options, etc.)
- Gzip compression
- WebSocket support for Next.js HMR

Configuration location:
- Source: `/home/ubuntu/dtcc-tracker/nginx/dtcc-tracker.conf`
- Deployed to: `/etc/nginx/sites-available/dtcc-tracker.conf`
- Enabled via: `/etc/nginx/sites-enabled/dtcc-tracker.conf`

## SSL/HTTPS Configuration

### Option 1: Custom SSL Certificate (e.g., Harica)

**Recommended if you already have or are purchasing an SSL certificate from a Certificate Authority.**

Complete guide: [Custom SSL Certificate Installation](nginx/CUSTOM-SSL-SETUP.md)

#### Quick Setup

1. **Obtain certificate from Harica** (or any CA)
   - Certificate file (`.crt` or `.pem`)
   - Private key (`.key`)
   - Intermediate/chain certificate

2. **Combine certificate with chain**:
   ```bash
   cat your-domain.crt intermediate.crt > fullchain.pem
   ```

3. **Upload to EC2**:
   ```bash
   scp -i your-key.pem fullchain.pem ubuntu@your-ec2-host:/tmp/
   scp -i your-key.pem your-domain.key ubuntu@your-ec2-host:/tmp/
   ```

4. **Install on EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-host

   sudo mkdir -p /etc/ssl/private /etc/ssl/certs
   sudo mv /tmp/fullchain.pem /etc/ssl/certs/your-domain-fullchain.pem
   sudo mv /tmp/your-domain.key /etc/ssl/private/your-domain.key
   sudo chmod 644 /etc/ssl/certs/your-domain-fullchain.pem
   sudo chmod 600 /etc/ssl/private/your-domain.key
   ```

5. **Update Nginx configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/dtcc-tracker.conf

   # Update these lines in HTTPS server block:
   ssl_certificate /etc/ssl/certs/your-domain-fullchain.pem;
   ssl_certificate_key /etc/ssl/private/your-domain.key;
   server_name your-domain.com www.your-domain.com;

   # Enable HTTPS redirect (uncomment line ~28):
   return 301 https://$host$request_uri;
   ```

6. **Test and reload**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

See [detailed guide](nginx/CUSTOM-SSL-SETUP.md) for verification, troubleshooting, and renewal procedures.

### Option 2: Let's Encrypt (Free)

**Recommended if you want free SSL certificates with automatic renewal.**

Use the provided script:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-host

# Navigate to project directory
cd /home/ubuntu/dtcc-tracker

# Run SSL setup script
sudo bash nginx/setup-ssl.sh
```

The script will:
1. Install Certbot
2. Obtain SSL certificate from Let's Encrypt
3. Update Nginx configuration
4. Enable HTTPS redirect
5. Configure automatic renewal (every 90 days)

### Option 3: CloudFront with ACM (Optional)

**For CDN caching and AWS-managed certificates.**

See [CloudFront Setup Guide](nginx/CLOUDFRONT-SETUP.md) for complete instructions.

## Manual Deployment Commands

If you need to deploy manually:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-host

# Navigate to project directory
cd /home/ubuntu/dtcc-tracker

# Pull latest code
git pull origin main

# Deploy Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input
sudo systemctl restart dtcc-tracker-backend
deactivate

# Deploy Frontend
cd ../frontend
npm ci
npm run build
sudo systemctl restart dtcc-tracker-frontend

# Update Nginx configuration
cd ..
sudo cp nginx/dtcc-tracker.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring and Logs

### Check Service Status

```bash
# Backend status
sudo systemctl status dtcc-tracker-backend

# Frontend status
sudo systemctl status dtcc-tracker-frontend

# Nginx status
sudo systemctl status nginx
```

### View Logs

```bash
# Backend logs
sudo journalctl -u dtcc-tracker-backend -f

# Frontend logs
sudo journalctl -u dtcc-tracker-frontend -f

# Nginx logs
sudo journalctl -u nginx -f

# Or view log files directly
sudo tail -f /var/log/dtcc-tracker-backend-access.log
sudo tail -f /var/log/dtcc-tracker-frontend.log
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart dtcc-tracker-backend

# Restart frontend
sudo systemctl restart dtcc-tracker-frontend

# Restart nginx
sudo systemctl restart nginx

# Reload nginx (no downtime)
sudo systemctl reload nginx

# Restart all services
sudo systemctl restart dtcc-tracker-backend dtcc-tracker-frontend nginx
```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for error details
2. Verify all secrets are correctly configured
3. Ensure EC2 instance is accessible via SSH
4. Check EC2 security group allows necessary ports

### Service Won't Start

1. Check service status: `sudo systemctl status dtcc-tracker-backend`
2. View logs: `sudo journalctl -u dtcc-tracker-backend -n 50`
3. Verify environment file exists: `/home/ubuntu/dtcc-tracker/backend/.env`
4. Ensure all dependencies are installed
5. Check file permissions

### Database Issues

```bash
# Run migrations manually
cd /home/ubuntu/dtcc-tracker/backend
source venv/bin/activate
python manage.py migrate
python manage.py showmigrations
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :8000
sudo lsof -i :3000

# Kill process if needed
sudo kill <PID>
```

### Nginx Issues

#### Configuration Test Fails

```bash
# Test nginx configuration
sudo nginx -t

# Check for syntax errors in config file
sudo cat /etc/nginx/sites-available/dtcc-tracker.conf
```

#### 502 Bad Gateway Error

This usually means nginx cannot connect to the backend/frontend services:

```bash
# Check if backend and frontend are running
sudo systemctl status dtcc-tracker-backend
sudo systemctl status dtcc-tracker-frontend

# Check if services are listening on correct ports
sudo netstat -tlnp | grep 8000
sudo netstat -tlnp | grep 3000

# View nginx error logs for details
sudo tail -n 50 /var/log/nginx/error.log
```

#### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### Cannot Access Site

```bash
# Check nginx is running
sudo systemctl status nginx

# Check firewall/security group allows ports 80 and 443
# On EC2, verify security group in AWS console

# Test nginx configuration
sudo nginx -t

# View access logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Environment Variables

### Backend (.env)

Located at: `/home/ubuntu/dtcc-tracker/backend/.env`

```
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
```

### Frontend (.env.production.local)

Located at: `/home/ubuntu/dtcc-tracker/frontend/.env.production.local`

```
NEXT_PUBLIC_API_URL=http://your-domain:8000
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong SECRET_KEY** for Django (generate with `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
3. **Keep SSH private keys secure** - restrict access to authorized IPs only
4. **Regularly update dependencies** - run `pip list --outdated` and `npm outdated`
5. **Backend/Frontend bind to localhost** - not exposed directly, only via Nginx
6. **Enable HTTPS** with SSL/TLS certificates for production
7. **Configure firewall rules** - only allow necessary ports (22, 80, 443)
8. **Use environment-specific secrets** in GitHub Actions
9. **Security headers enabled** in Nginx (HSTS, X-Content-Type-Options, etc.)
10. **Disable DEBUG mode** in Django production settings

## Production Checklist

Before going live, ensure:

- [ ] SSL certificate is configured and working
- [ ] HTTPS redirect is enabled in Nginx
- [ ] Django DEBUG=False in production
- [ ] Strong SECRET_KEY is set
- [ ] Database backups are configured
- [ ] Security group restricts SSH to specific IPs
- [ ] All services start on boot (systemctl enable)
- [ ] Log rotation is configured
- [ ] Monitoring/alerting is set up (optional)
- [ ] Domain DNS points to EC2 instance

## Next Steps

Additional improvements to consider:

- **Database backups**: Automated daily backups to S3
- **Monitoring and alerting**: CloudWatch, Datadog, or Prometheus
- **Log aggregation**: ELK stack or CloudWatch Logs
- **CDN for static assets**: CloudFront or similar
- **Auto-scaling groups**: For high availability
- **Load balancer**: For multiple instances
- **CI/CD enhancements**: Add tests, linting, security scans
- **Container deployment**: Consider Docker + ECS/EKS
- **Infrastructure as Code**: Terraform or CloudFormation
