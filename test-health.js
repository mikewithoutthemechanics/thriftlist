#!/usr/bin/env node

/**
 * Thrift List Health Check Script
 * Tests all critical integrations and endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n[TEST] ${name}`, 'blue');
    await fn();
    log(`✓ ${name} passed`, 'green');
    return true;
  } catch (err) {
    log(`✗ ${name} failed: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  log('=== Thrift List Health Check ===\n', 'blue');

  const results = [];

  // 1. Health endpoint
  results.push(await test('Health Check Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'degraded') {
      log(`  Degraded: ${JSON.stringify(data.checks, null, 2)}`, 'yellow');
    }
  }));

  // 2. AI endpoint
  results.push(await test('AI Title Generation', async () => {
    const res = await fetch(`${BASE_URL}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'title',
        data: { title: 'test', description: 'test item' },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.result) throw new Error('No result returned');
  }));

  // 3. Settings endpoint
  results.push(await test('Settings Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.settings) throw new Error('No settings returned');
  }));

  // 4. Scheduled postings endpoint
  results.push(await test('Scheduled Postings Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/scheduled-postings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.scheduled_postings)) throw new Error('Invalid response');
  }));

  // 5. Items endpoint
  results.push(await test('Items Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/items`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid response');
  }));

  // 6. OAuth Facebook endpoint
  results.push(await test('Facebook OAuth Initiation', async () => {
    const res = await fetch(`${BASE_URL}/api/oauth/facebook`);
    // Should redirect, so 302 or 307 is expected
    if (res.status !== 302 && res.status !== 307) {
      throw new Error(`Expected redirect, got ${res.status}`);
    }
  }));

  // 7. Upload endpoint (without actual file)
  results.push(await test('Upload Endpoint (No File)', async () => {
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
    });
    // Should fail without file
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  }));

  // 8. Automation endpoint (without job)
  results.push(await test('Automation Endpoint (No Job)', async () => {
    const res = await fetch(`${BASE_URL}/api/automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    // Should fail without job data
    if (res.status !== 400 && res.status !== 401) {
      throw new Error(`Expected 400/401, got ${res.status}`);
    }
  }));

  // Summary
  log('\n=== Summary ===', 'blue');
  const passed = results.filter(r => r).length;
  const total = results.length;
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n✓ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', 'red');
    process.exit(1);
  }
}

main().catch(err => {
  log(`\nFatal error: ${err.message}`, 'red');
  process.exit(1);
});
