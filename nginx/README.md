# Nginx Configuration for DTCC Tracker

This directory contains the Nginx reverse proxy configuration for the DTCC Tracker application.

## Files

- **dtcc-tracker-cloudfront.conf** - Nginx config for CloudFront setup (default)
- **dtcc-tracker.conf** - Nginx config for direct EC2 access with SSL
- **setup-ssl.sh** - Script to set up Let's Encrypt SSL certificates
- **CLOUDFRONT-SETUP.md** - Complete guide for CloudFront with ACM certificate
- **README.md** - This file

## Which Configuration to Use?

### Direct EC2 with Custom SSL or Let's Encrypt (Current Setup) ✅

**Use `dtcc-tracker.conf` for:**
- Custom SSL certificate from Harica or any CA
- Let's Encrypt free SSL certificate
- Direct HTTPS access to your EC2 instance
- Standard Nginx reverse proxy setup

**Current Setup**: The deployment workflow uses this configuration.

**Setup Guides**:
- Custom SSL (Harica, etc.): [CUSTOM-SSL-SETUP.md](CUSTOM-SSL-SETUP.md)
- Let's Encrypt: Run `sudo bash nginx/setup-ssl.sh` after deployment

### CloudFront + ACM (Optional)

**Use `dtcc-tracker-cloudfront.conf` if:**
- You want to use CloudFront CDN
- You have an ACM certificate
- You want CDN caching and DDoS protection

**Setup Guide**: [CLOUDFRONT-SETUP.md](CLOUDFRONT-SETUP.md)

## Configuration Overview

The Nginx configuration serves as a reverse proxy with the following routing:

```

### CloudFront Setup (Current)
```
Client Request (HTTPS) → CloudFront (ACM Certificate) → EC2 Nginx (Port 80) → Backend/Frontend
```

### Direct EC2 Setup
```
Client Request → Nginx (Port 80/443) → Backend/Frontend
```

## Features

- **Reverse Proxy**: Routes requests to backend and frontend
- **Static File Serving**: Direct serving of static/media files with caching
- **Security Headers**: HSTS, X-Content-Type-Options, X-Frame-Options, etc.
- **Gzip Compression**: Automatic compression for text-based content
- **WebSocket Support**: For Next.js Hot Module Replacement
- **SSL/TLS**: Modern TLS 1.2/1.3 configuration
- **Connection Keepalive**: Efficient connection pooling to backend services

## Deployment

The Nginx configuration is automatically deployed by the GitHub Actions workflow:

1. Workflow copies `nginx/dtcc-tracker.conf` to `/etc/nginx/sites-available/`
2. Creates symlink in `/etc/nginx/sites-enabled/`
3. Tests configuration with `nginx -t`
4. Reloads Nginx

## Manual Installation

If you need to install/update Nginx configuration manually:

```bash
# Copy configuration
sudo cp nginx/dtcc-tracker.conf /etc/nginx/sites-available/dtcc-tracker.conf

# Create symlink
sudo ln -s /etc/nginx/sites-available/dtcc-tracker.conf /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Testing

### Test HTTP Access

```bash
curl -I http://your-domain.com
```

### Test HTTPS Access

```bash
curl -I https://your-domain.com
```

### Test Backend API

```bash
curl https://your-domain.com/api/
```

### Test HTTPS Redirect

```bash
curl -I http://your-domain.com
# Should return 301 redirect to https://
```

## Security Headers

The configuration includes these security headers:

- `Strict-Transport-Security`: Forces HTTPS for 1 year
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Enables XSS filter
- `Referrer-Policy`: Controls referrer information

## Performance Optimizations

- **Keepalive connections**: 64 connections to backend/frontend
- **Gzip compression**: Automatic for text content
- **Static file caching**: 30 days for static, 7 days for media
- **HTTP/2**: Enabled for HTTPS connections
- **Connection pooling**: Efficient upstream connections

## Troubleshooting

### 502 Bad Gateway

Backend or frontend service is not running:

```bash
sudo systemctl status dtcc-tracker-backend
sudo systemctl status dtcc-tracker-frontend
```

### Configuration Test Fails

```bash
sudo nginx -t
```

Check the error message and fix the configuration file.

### SSL Certificate Issues

If using your own certificate, ensure:
- Certificate files exist at the specified paths
- Files have correct permissions (readable by nginx user)
- Certificate is valid and not expired

```bash
# Check certificate expiration
openssl x509 -in /path/to/cert.pem -noout -enddate
```

## Logs

Nginx logs are located at:
- Access log: `/var/log/nginx/access.log`
- Error log: `/var/log/nginx/error.log`

View logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```
