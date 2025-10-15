# Scripts Directory

## DNS Management

### update-godaddy-dns.js

Helper script to update GoDaddy DNS records programmatically.

**Prerequisites:**
- `.godaddy-config.json` file in project root (git-ignored)

**Usage:**

```bash
# List all current DNS records
node scripts/update-godaddy-dns.js

# Update a specific record
node scripts/update-godaddy-dns.js <subdomain> <type> <target> [ttl]

# Examples:
node scripts/update-godaddy-dns.js www CNAME airportwatch-dockerhub-8sydh.ondigitalocean.app
node scripts/update-godaddy-dns.js @ A 104.248.57.74
node scripts/update-godaddy-dns.js api CNAME api-server.example.com 3600
```

**Common DNS Updates:**

```bash
# Update www to point to new DigitalOcean app
node scripts/update-godaddy-dns.js www CNAME your-app-name.ondigitalocean.app

# List all records to verify
node scripts/update-godaddy-dns.js
```

**Note:** DNS propagation can take 5-30 minutes after updates.

