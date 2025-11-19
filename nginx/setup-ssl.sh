#!/bin/bash

# DTCC Tracker - SSL Certificate Setup Script
# This script configures Let's Encrypt SSL certificates for the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DTCC Tracker - SSL Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo${NC}"
  exit 1
fi

# Prompt for domain name
echo -e "${YELLOW}Enter your domain name (e.g., example.com):${NC}"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
  echo -e "${RED}Domain name cannot be empty${NC}"
  exit 1
fi

echo -e "${YELLOW}Enter your email address for Let's Encrypt notifications:${NC}"
read -r EMAIL

if [ -z "$EMAIL" ]; then
  echo -e "${RED}Email address cannot be empty${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}Email: ${EMAIL}${NC}"
echo ""
echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
read -r

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}Installing Certbot...${NC}"
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
  echo -e "${GREEN}✓${NC} Certbot installed"
else
  echo -e "${GREEN}✓${NC} Certbot already installed"
fi

# Create directory for certbot challenges
mkdir -p /var/www/certbot

# Stop nginx temporarily
echo -e "${YELLOW}Stopping Nginx temporarily...${NC}"
systemctl stop nginx

# Obtain SSL certificate
echo -e "${YELLOW}Obtaining SSL certificate from Let's Encrypt...${NC}"
certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Failed to obtain SSL certificate${NC}"
  systemctl start nginx
  exit 1
fi

echo -e "${GREEN}✓${NC} SSL certificate obtained successfully"

# Update nginx configuration with the actual domain
NGINX_CONF="/etc/nginx/sites-available/dtcc-tracker.conf"

echo -e "${YELLOW}Updating Nginx configuration...${NC}"

# Replace placeholder domain with actual domain
sed -i "s/your-domain.com/$DOMAIN/g" "$NGINX_CONF"

# Uncomment HTTPS redirect
sed -i 's/# return 301 https/return 301 https/g' "$NGINX_CONF"

# Comment out HTTP proxy locations (since we're redirecting to HTTPS)
sed -i '/# For initial setup without SSL/,/^    }$/s/^    location/    # location/g' "$NGINX_CONF"
sed -i '/# For initial setup without SSL/,/^    }$/s/^        proxy/        # proxy/g' "$NGINX_CONF"

echo -e "${GREEN}✓${NC} Nginx configuration updated"

# Test nginx configuration
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Nginx configuration test failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Nginx configuration is valid"

# Start nginx
echo -e "${YELLOW}Starting Nginx...${NC}"
systemctl start nginx
systemctl reload nginx

echo -e "${GREEN}✓${NC} Nginx started successfully"

# Setup auto-renewal
echo -e "${YELLOW}Setting up automatic certificate renewal...${NC}"

# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Certificate auto-renewal is configured"
else
  echo -e "${YELLOW}⚠${NC} Certificate renewal test had warnings (may still work)"
fi

# Add cron job for renewal if it doesn't exist
CRON_CMD="0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  echo -e "${GREEN}✓${NC} Added cron job for automatic renewal"
else
  echo -e "${GREEN}✓${NC} Cron job for renewal already exists"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Your site is now secured with HTTPS${NC}"
echo -e "${BLUE}Certificate location:${NC} /etc/letsencrypt/live/$DOMAIN/"
echo -e "${BLUE}Certificate expires:${NC} $(date -d '+90 days' '+%Y-%m-%d')"
echo -e "${BLUE}Auto-renewal:${NC} Configured to run daily at 3:00 AM"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Visit https://$DOMAIN to verify SSL is working"
echo -e "2. Update your DNS records if not already done"
echo -e "3. Test HTTP to HTTPS redirect"
echo ""
