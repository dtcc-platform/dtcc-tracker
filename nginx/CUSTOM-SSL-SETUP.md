# Custom SSL Certificate Installation Guide

This guide shows how to install an SSL certificate from Harica (or any certificate authority) on your EC2 Nginx server.

## Prerequisites

- SSL certificate files from Harica (or your CA)
- EC2 instance deployed with the application
- SSH access to your EC2 instance
- Domain name pointing to your EC2 instance

## Certificate Files You'll Receive from Harica

After purchasing/obtaining your certificate from Harica, you should receive:

1. **Certificate file** - `your-domain.crt` or `your-domain.pem`
2. **Private key file** - `your-domain.key` (you generated this during CSR creation)
3. **Intermediate/Chain certificate** - `intermediate.crt` or `ca-bundle.crt`

## Step 1: Prepare Certificate Files

### Combine Certificate with Chain

Nginx requires the full certificate chain in one file:

```bash
# On your local machine, combine the files
cat your-domain.crt intermediate.crt > fullchain.pem

# Or if you have multiple intermediate certificates
cat your-domain.crt intermediate1.crt intermediate2.crt > fullchain.pem
```

Now you should have:
- `fullchain.pem` - Your certificate + intermediate certificates
- `your-domain.key` - Your private key

## Step 2: Upload Certificates to EC2

### Option A: Using SCP

```bash
# From your local machine
scp -i your-key.pem fullchain.pem ubuntu@your-ec2-host:/tmp/
scp -i your-key.pem your-domain.key ubuntu@your-ec2-host:/tmp/
```

### Option B: Using SSH and Paste

```bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@your-ec2-host

# Create certificate files and paste content
sudo nano /tmp/fullchain.pem
# Paste the fullchain content, then Ctrl+X, Y, Enter

sudo nano /tmp/your-domain.key
# Paste the private key content, then Ctrl+X, Y, Enter
```

## Step 3: Install Certificates on EC2

SSH into your EC2 instance and run:

```bash
# Create SSL directory if it doesn't exist
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Move certificates to proper locations
sudo mv /tmp/fullchain.pem /etc/ssl/certs/your-domain-fullchain.pem
sudo mv /tmp/your-domain.key /etc/ssl/private/your-domain.key

# Set proper permissions (important for security)
sudo chmod 644 /etc/ssl/certs/your-domain-fullchain.pem
sudo chmod 600 /etc/ssl/private/your-domain.key
sudo chown root:root /etc/ssl/certs/your-domain-fullchain.pem
sudo chown root:root /etc/ssl/private/your-domain.key
```

## Step 4: Update Nginx Configuration

Edit the Nginx configuration to point to your certificates:

```bash
sudo nano /etc/nginx/sites-available/dtcc-tracker.conf
```

Find the HTTPS server block (around line 92-100) and update these lines:

```nginx
# Replace these lines:
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# With your actual paths:
ssl_certificate /etc/ssl/certs/your-domain-fullchain.pem;
ssl_certificate_key /etc/ssl/private/your-domain.key;
```

Also update the server_name:

```nginx
# Replace:
server_name _;

# With your actual domain:
server_name your-domain.com www.your-domain.com;
```

Enable HTTPS redirect in the HTTP server block (around line 28):

```nginx
# Uncomment this line:
return 301 https://$host$request_uri;
```

Comment out the HTTP proxy locations (lines 30-89) since all traffic will redirect to HTTPS:

```nginx
# Comment out everything between "# For initial setup without SSL" and the closing }
```

## Step 5: Verify Certificate

Before reloading Nginx, verify your certificate is valid:

```bash
# Check certificate content
sudo openssl x509 -in /etc/ssl/certs/your-domain-fullchain.pem -text -noout

# Verify certificate matches private key
sudo openssl x509 -noout -modulus -in /etc/ssl/certs/your-domain-fullchain.pem | openssl md5
sudo openssl rsa -noout -modulus -in /etc/ssl/private/your-domain.key | openssl md5
# The MD5 hashes should match

# Check certificate expiration
sudo openssl x509 -noout -dates -in /etc/ssl/certs/your-domain-fullchain.pem

# Verify certificate chain
sudo openssl verify -CAfile /etc/ssl/certs/your-domain-fullchain.pem /etc/ssl/certs/your-domain-fullchain.pem
```

## Step 6: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

## Step 7: Test HTTPS Access

From your local machine:

```bash
# Test HTTPS access
curl -I https://your-domain.com

# Test HTTP to HTTPS redirect
curl -I http://your-domain.com
# Should return 301 redirect

# Check SSL certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null

# Test with browser
# Visit https://your-domain.com and check for valid SSL certificate
```

## Step 8: Verify Security Group

Ensure your EC2 security group allows:
- Port 22 (SSH) - Your IP only
- Port 80 (HTTP) - 0.0.0.0/0
- Port 443 (HTTPS) - 0.0.0.0/0

## Certificate Renewal

Harica certificates typically last 1-2 years. You'll need to manually renew before expiration:

### Set Up Expiration Reminder

```bash
# Add to crontab to check certificate expiration monthly
crontab -e

# Add this line:
0 9 1 * * openssl x509 -enddate -noout -in /etc/ssl/certs/your-domain-fullchain.pem | mail -s "SSL Certificate Status" your-email@example.com
```

### Renewal Process

When it's time to renew (30-60 days before expiration):

1. Generate new CSR or use existing one
2. Purchase/obtain new certificate from Harica
3. Follow steps 1-6 above with new certificate files
4. No downtime required (reload nginx, don't restart)

## Troubleshooting

### Nginx Won't Start After Certificate Installation

Check nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

Common issues:
- **Wrong permissions**: Run `sudo chmod 600 /etc/ssl/private/your-domain.key`
- **Wrong paths**: Verify paths in nginx config match actual file locations
- **Incomplete chain**: Ensure fullchain.pem includes intermediate certificates
- **Certificate-key mismatch**: Verify modulus match (step 5)

### Browser Shows "Certificate Not Trusted"

- Check if intermediate certificates are included in fullchain.pem
- Verify Harica root CA is trusted by browsers (it should be)
- Clear browser cache and try again

### Mixed Content Warnings

If you see mixed content warnings:
- Update NEXT_PUBLIC_API_URL to use https://
- Check all API calls use relative URLs or https://

### Certificate Mismatch Error

Ensure certificate CN or SAN matches your domain:
```bash
sudo openssl x509 -in /etc/ssl/certs/your-domain-fullchain.pem -text -noout | grep -A1 "Subject:"
sudo openssl x509 -in /etc/ssl/certs/your-domain-fullchain.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## Security Best Practices

1. **Never commit private keys** to version control
2. **Restrict private key permissions**: `chmod 600`
3. **Use strong ciphers**: Already configured in dtcc-tracker.conf
4. **Enable HSTS**: Already configured in dtcc-tracker.conf
5. **Monitor expiration**: Set up alerts 30 days before expiration
6. **Keep backups**: Store certificates securely off-server
7. **Use strong key**: Use at least 2048-bit RSA or 256-bit ECC

## Quick Reference: File Locations

```
/etc/ssl/certs/your-domain-fullchain.pem    # Public certificate + chain
/etc/ssl/private/your-domain.key            # Private key (600 permissions)
/etc/nginx/sites-available/dtcc-tracker.conf # Nginx config
/etc/nginx/sites-enabled/dtcc-tracker.conf  # Symlink to config
```

## Testing SSL Configuration

Use these online tools:
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Security Headers**: https://securityheaders.com/

Aim for A+ rating on SSL Labs.

## Example: Complete Certificate Installation

```bash
# 1. Upload and install certificates
sudo mv /tmp/fullchain.pem /etc/ssl/certs/example.com-fullchain.pem
sudo mv /tmp/example.key /etc/ssl/private/example.com.key
sudo chmod 644 /etc/ssl/certs/example.com-fullchain.pem
sudo chmod 600 /etc/ssl/private/example.com.key

# 2. Update nginx config
sudo nano /etc/nginx/sites-available/dtcc-tracker.conf
# Update ssl_certificate paths and server_name
# Enable HTTPS redirect

# 3. Test and reload
sudo nginx -t
sudo systemctl reload nginx

# 4. Test HTTPS
curl -I https://example.com
```

Your site should now be accessible via HTTPS with your Harica certificate!
