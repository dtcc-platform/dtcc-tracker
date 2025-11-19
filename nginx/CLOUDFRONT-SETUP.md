# CloudFront Setup Guide

This guide walks you through setting up Amazon CloudFront with your ACM certificate for the DTCC Tracker application.

## Architecture

```
Client (HTTPS) → CloudFront (ACM Certificate) → EC2 Nginx (HTTP) → Backend/Frontend
```

## Benefits

- Use your existing ACM certificate
- CDN caching for better global performance
- DDoS protection with AWS Shield Standard
- Lower data transfer costs from EC2
- No ALB cost (saves ~$16-20/month)

## Prerequisites

- ACM certificate in **us-east-1** region (CloudFront requires this)
- Domain name configured in ACM certificate
- EC2 instance deployed with the application

## Step 1: Update Nginx Configuration

Use the CloudFront-specific configuration instead of the standard one:

```bash
# On your EC2 instance or in the deployment
cp nginx/dtcc-tracker-cloudfront.conf /etc/nginx/sites-available/dtcc-tracker.conf
sudo systemctl reload nginx
```

Or update the deployment workflow to use `dtcc-tracker-cloudfront.conf` instead of `dtcc-tracker.conf`.

## Step 2: Create CloudFront Distribution

### Via AWS Console

1. **Navigate to CloudFront**
   - Go to AWS Console > CloudFront
   - Click "Create Distribution"

2. **Origin Settings**
   - **Origin domain**: Your EC2 public IP or domain (e.g., `1.2.3.4` or `ec2-1-2-3-4.compute-1.amazonaws.com`)
   - **Protocol**: HTTP only
   - **HTTP port**: 80
   - **Origin path**: Leave empty
   - **Name**: `dtcc-tracker-origin`
   - **Add custom header**:
     - Header name: `X-CloudFront-Secret`
     - Value: `[generate-a-random-string]` (for security)
   - **Origin Shield**: Enabled (select closest region to your EC2, e.g., `us-east-1`)
   - **Connection attempts**: 3
   - **Connection timeout**: 10 seconds
   - **Origin keep-alive timeout**: 5 seconds
   - **Origin read timeout**: 60 seconds

3. **Default Cache Behavior**
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy**: CachingOptimized (or create custom)
   - **Origin request policy**: AllViewerExceptHostHeader
   - **Response headers policy**:
     - Create custom or use SecurityHeadersPolicy
     - Include: HSTS, X-Content-Type-Options, X-Frame-Options
   - **Compress objects automatically**: Yes

4. **Additional Cache Behaviors** (Create in this order)

   **API Behavior** (`/api/*`):
   - Path pattern: `/api/*`
   - Origin: dtcc-tracker-origin
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache policy: CachingDisabled
   - Origin request policy: AllViewer
   - Compress objects: Yes

   **Admin Behavior** (`/admin/*`):
   - Path pattern: `/admin/*`
   - Origin: dtcc-tracker-origin
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache policy: CachingDisabled
   - Origin request policy: AllViewer
   - Compress objects: Yes

   **Static Files** (`/static/*`):
   - Path pattern: `/static/*`
   - Origin: dtcc-tracker-origin
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD
   - Cache policy: CachingOptimized
   - TTL: Min=86400, Max=31536000, Default=86400
   - Compress objects: Yes

   **Media Files** (`/media/*`):
   - Path pattern: `/media/*`
   - Origin: dtcc-tracker-origin
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD
   - Cache policy: Create custom with TTL Min=0, Max=604800, Default=604800
   - Compress objects: No (media files are usually already compressed)

5. **Distribution Settings**
   - **Price class**: Use all edge locations (or select based on your needs)
   - **AWS WAF**: Optional (recommended for production)
   - **Alternate domain names (CNAMEs)**: Your domain (e.g., `example.com`, `www.example.com`)
   - **Custom SSL certificate**: Select your ACM certificate
   - **Supported HTTP versions**: HTTP/2 and HTTP/3
   - **Default root object**: Leave empty (Next.js handles this)
   - **Standard logging**: Enabled (optional but recommended)
   - **IPv6**: Enabled
   - **Description**: `DTCC Tracker CloudFront Distribution`

6. **Create Distribution**
   - Click "Create distribution"
   - Wait for deployment (10-15 minutes)

### Via AWS CLI

```bash
# Create a distribution config JSON file first
cat > cloudfront-config.json <<'EOF'
{
  "CallerReference": "dtcc-tracker-$(date +%s)",
  "Comment": "DTCC Tracker Distribution",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "dtcc-tracker-origin",
        "DomainName": "YOUR_EC2_IP_OR_DOMAIN",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          },
          "OriginReadTimeout": 60,
          "OriginKeepaliveTimeout": 5
        },
        "OriginShield": {
          "Enabled": true,
          "OriginShieldRegion": "us-east-1"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "dtcc-tracker-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "OriginRequestPolicyId": "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "YOUR_ACM_CERTIFICATE_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Aliases": {
    "Quantity": 1,
    "Items": ["your-domain.com"]
  }
}
EOF

# Create distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## Step 3: Update Security Group

Update your EC2 security group to only allow traffic from CloudFront:

### Option A: Allow All (Simple but less secure)

```bash
# Allow HTTP from anywhere
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0
```

### Option B: CloudFront IPs Only (More secure)

Download CloudFront IP ranges and add to security group:

```bash
# Get CloudFront IP ranges
curl https://ip-ranges.amazonaws.com/ip-ranges.json | \
  jq -r '.prefixes[] | select(.service=="CLOUDFRONT") | .ip_prefix' > cloudfront-ips.txt

# Add each IP range to security group
while read ip; do
  aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr $ip
done < cloudfront-ips.txt
```

**Note**: CloudFront IPs change periodically. Consider using AWS Lambda to auto-update or use AWS WAF with rate limiting instead.

### Final Security Group Rules

- **Port 22**: Your IP only (SSH)
- **Port 80**: CloudFront IPs or 0.0.0.0/0
- **Ports 443, 8000, 3000**: REMOVE (not needed)

## Step 4: Update DNS

Point your domain to the CloudFront distribution:

### Route 53

1. Go to Route 53 > Hosted zones
2. Select your domain
3. Create/Update A record:
   - **Name**: `example.com` or `www.example.com`
   - **Type**: A - IPv4 address
   - **Alias**: Yes
   - **Alias target**: Your CloudFront distribution
   - **Routing policy**: Simple routing

### Other DNS Providers

Create a CNAME record:
- **Name**: `www` or `@`
- **Type**: CNAME
- **Value**: `d111111abcdef8.cloudfront.net` (your CloudFront domain)
- **TTL**: 300

## Step 5: Update Deployment Workflow

Edit `.github/workflows/deploy-ec2.yml` to use the CloudFront config:

```yaml
# Change this line in the nginx deployment section:
sudo cp nginx/dtcc-tracker-cloudfront.conf /etc/nginx/sites-available/dtcc-tracker.conf
```

## Step 6: Test

1. **Wait for CloudFront deployment** (10-15 minutes)

2. **Test HTTP to HTTPS redirect**:
   ```bash
   curl -I http://your-domain.com
   # Should return 301 redirect to https://
   ```

3. **Test HTTPS access**:
   ```bash
   curl -I https://your-domain.com
   # Should return 200 OK
   ```

4. **Test API endpoint**:
   ```bash
   curl https://your-domain.com/api/
   ```

5. **Check CloudFront headers**:
   ```bash
   curl -I https://your-domain.com
   # Look for: x-cache: Hit from cloudfront or Miss from cloudfront
   ```

## Cache Behavior Summary

Based on AWS best practices from Context7:

| Path Pattern | Cache Policy | TTL | Compression |
|-------------|--------------|-----|-------------|
| `/api/*` | CachingDisabled | N/A | Yes |
| `/admin/*` | CachingDisabled | N/A | Yes |
| `/static/*` | CachingOptimized | 1 year | Yes |
| `/media/*` | Custom | 7 days | No |
| `/*` (default) | CachingOptimized | 24 hours | Yes |

## Security Enhancements

### Add Custom Header for Origin Security

In CloudFront origin settings, add a custom header:
- Header: `X-CloudFront-Secret`
- Value: `[random-string-here]`

Then update Nginx to verify this header:

```nginx
# Add to each location block
if ($http_x_cloudfront_secret != "your-random-string") {
    return 403;
}
```

This ensures only CloudFront can access your origin.

## Monitoring

### CloudFront Metrics

Monitor in CloudFront console:
- Requests
- Bytes downloaded/uploaded
- Error rate
- Cache hit rate

### Enable Access Logs

1. Create S3 bucket for logs
2. In CloudFront distribution settings:
   - Enable logging
   - Select S3 bucket
   - Log prefix: `cloudfront/dtcc-tracker/`

## Cost Considerations

CloudFront pricing (approximate):
- Data transfer out: $0.085/GB (first 10TB)
- HTTP/HTTPS requests: $0.0075 per 10,000 requests
- No charge for data transfer from CloudFront to origin

Typical cost for small app: $5-20/month depending on traffic.

## Troubleshooting

### 502 Bad Gateway

- Check EC2 security group allows traffic from CloudFront
- Verify nginx is running: `sudo systemctl status nginx`
- Check origin health in CloudFront console

### 504 Gateway Timeout

- Increase origin read timeout in CloudFront (default: 30s)
- Check backend/frontend response times

### Cache Not Working

- Verify Cache-Control headers are set correctly
- Check CloudFront cache behavior settings
- Use `x-cache` header to debug (Miss/Hit from cloudfront)

### SSL Certificate Issues

- Verify ACM certificate is in us-east-1 region
- Ensure domain matches certificate CN/SAN
- Check certificate status is "Issued"

## Invalidation

To clear CloudFront cache after deployment:

```bash
# Invalidate all files
aws cloudfront create-invalidation \
    --distribution-id E1HVIAU7U12ABC \
    --paths "/*"

# Invalidate specific paths
aws cloudfront create-invalidation \
    --distribution-id E1HVIAU7U12ABC \
    --paths "/api/*" "/static/*"
```

**Note**: First 1,000 invalidation paths per month are free, then $0.005 per path.

## Next Steps

- Enable AWS WAF for DDoS/bot protection
- Configure CloudFront Functions for edge logic
- Set up CloudWatch alarms for monitoring
- Enable AWS Shield Advanced for enhanced DDoS protection (optional, $3,000/month)
