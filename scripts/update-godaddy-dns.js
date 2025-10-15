#!/usr/bin/env node

/**
 * GoDaddy DNS Update Script
 * 
 * Usage:
 *   node scripts/update-godaddy-dns.js <subdomain> <type> <target>
 * 
 * Examples:
 *   node scripts/update-godaddy-dns.js www CNAME airportwatch-dockerhub-8sydh.ondigitalocean.app
 *   node scripts/update-godaddy-dns.js @ A 104.248.57.74
 *   node scripts/update-godaddy-dns.js api CNAME api-server.example.com
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, '..', '.godaddy-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: .godaddy-config.json not found!');
  console.error('   Please create this file with your GoDaddy API credentials.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { api_key, api_secret, domain, default_ttl } = config;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.godaddy.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `sso-key ${api_key}:${api_secret}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function listRecords() {
  console.log('🔍 Fetching current DNS records...\n');
  const records = await makeRequest('GET', `/v1/domains/${domain}/records`);
  
  console.log('📋 Current DNS Records:');
  records.forEach(record => {
    if (record.type === 'A' || record.type === 'CNAME') {
      const displayName = record.name === '@' ? domain : `${record.name}.${domain}`;
      console.log(`  ${displayName} (${record.type}) -> ${record.data} [TTL: ${record.ttl}]`);
    }
  });
}

async function updateRecord(name, type, target, ttl = default_ttl) {
  console.log(`\n🔄 Updating ${name}.${domain} (${type}) -> ${target}...`);
  
  try {
    await makeRequest('PUT', `/v1/domains/${domain}/records/${type}/${name}`, [{
      data: target,
      ttl: ttl
    }]);
    
    const displayName = name === '@' ? domain : `${name}.${domain}`;
    console.log(`✅ Updated ${displayName} -> ${target}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${name}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // If no arguments, just list records
  if (args.length === 0) {
    await listRecords();
    console.log('\nℹ️  Usage: node scripts/update-godaddy-dns.js <subdomain> <type> <target> [ttl]');
    console.log('   Example: node scripts/update-godaddy-dns.js www CNAME myapp.ondigitalocean.app 600');
    return;
  }

  if (args.length < 3) {
    console.error('❌ Error: Missing arguments');
    console.error('   Usage: node scripts/update-godaddy-dns.js <subdomain> <type> <target> [ttl]');
    process.exit(1);
  }

  const [name, type, target, ttl] = args;
  
  await updateRecord(name, type, target, ttl ? parseInt(ttl) : default_ttl);
  
  console.log('\n⏳ DNS propagation may take 5-30 minutes.');
  console.log('🔗 Check status with: curl -I https://www.' + domain);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

