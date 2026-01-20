#!/usr/bin/env node
/**
 * Password Reset Acceptance Tests
 *
 * Tests the password reset flow end-to-end with real requestId traces.
 *
 * Usage:
 *   node scripts/test-password-reset.js
 *
 * Prerequisites:
 *   - Server running at http://localhost:5000
 *   - NODE_ENV=development (for devToken in response)
 *   - FORCE_EMAIL_MOCK_MODE=true (to avoid real email sending)
 */

import crypto from 'crypto';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
// Use a seeded user from seed-screenshot-users.ts
const TEST_EMAIL = process.env.TEST_EMAIL || 'sarah.johnson@example.com';

// Generate unique request IDs
function generateRequestId() {
  return crypto.randomUUID();
}

// Helper for API calls
async function apiCall(method, path, body = null, requestId = null) {
  const reqId = requestId || generateRequestId();
  const url = `${BASE_URL}${path}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': reqId,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n>>> ${method} ${path}`);
  console.log(`    x-request-id: ${reqId}`);

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`<<< ${response.status}`);
    console.log(`    Response:`, JSON.stringify(data, null, 2));

    return {
      status: response.status,
      data,
      requestId: reqId,
      serverRequestId: data.requestId || null,
    };
  } catch (error) {
    console.error(`!!! Error: ${error.message}`);
    return {
      status: 0,
      data: null,
      requestId: reqId,
      error: error.message,
    };
  }
}

// Test results storage
const results = [];

function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`\n${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details)}`);
  }
}

// =============================================================================
// TEST 1: Happy Path (Request → Verify → Reset)
// =============================================================================
async function test1_HappyPath() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Happy Path (Request → Verify → Reset)');
  console.log('='.repeat(70));

  const details = { requestIds: {} };

  // Step 1: Request token
  console.log('\n--- Step 1: Request password reset ---');
  const reqResult = await apiCall('POST', '/api/password-reset/request', { email: TEST_EMAIL });
  details.requestIds.request = reqResult.requestId;

  if (!reqResult.data?.devToken) {
    recordResult('Test 1: Happy Path', false, {
      reason: 'No devToken returned - server not in dev mode?',
      ...details
    });
    return null;
  }

  const token = reqResult.data.devToken;
  const tokenHashSuffix = reqResult.data.devTokenHashSuffix;
  details.tokenHashSuffix = tokenHashSuffix;
  console.log(`    devToken received (len=${token.length}), tokenHashSuffix=${tokenHashSuffix}`);

  // Step 2: Verify token
  console.log('\n--- Step 2: Verify token ---');
  const verifyResult = await apiCall('GET', `/api/password-reset/verify/${token}`);
  details.requestIds.verify = verifyResult.requestId;

  if (verifyResult.status !== 200 || !verifyResult.data?.valid) {
    recordResult('Test 1: Happy Path', false, {
      reason: `Verify failed: status=${verifyResult.status}, valid=${verifyResult.data?.valid}`,
      ...details
    });
    return null;
  }

  // Step 3: Reset password
  console.log('\n--- Step 3: Reset password ---');
  const resetResult = await apiCall('POST', '/api/password-reset/reset', {
    token,
    newPassword: 'NewSecure123!@#'
  });
  details.requestIds.reset = resetResult.requestId;

  if (resetResult.status !== 200) {
    recordResult('Test 1: Happy Path', false, {
      reason: `Reset failed: status=${resetResult.status}, code=${resetResult.data?.code}`,
      ...details
    });
    return null;
  }

  recordResult('Test 1: Happy Path', true, details);
  return token; // Return token for Test 2
}

// =============================================================================
// TEST 2: Used Token (Reset twice with same token)
// =============================================================================
async function test2_UsedToken(previousToken) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Used Token (Reset twice with same token)');
  console.log('='.repeat(70));

  const details = { requestIds: {} };

  if (!previousToken) {
    // Need to create a fresh token and use it first
    console.log('\n--- Creating fresh token for used-token test ---');
    const reqResult = await apiCall('POST', '/api/password-reset/request', { email: TEST_EMAIL });
    details.requestIds.request = reqResult.requestId;

    if (!reqResult.data?.devToken) {
      recordResult('Test 2: Used Token', false, { reason: 'No devToken returned' });
      return;
    }

    previousToken = reqResult.data.devToken;
    details.tokenHashSuffix = reqResult.data.devTokenHashSuffix;

    // First reset (should succeed)
    console.log('\n--- First reset (should succeed) ---');
    const firstReset = await apiCall('POST', '/api/password-reset/reset', {
      token: previousToken,
      newPassword: 'FirstReset123!@#'
    });
    details.requestIds.firstReset = firstReset.requestId;

    if (firstReset.status !== 200) {
      recordResult('Test 2: Used Token', false, {
        reason: `First reset failed unexpectedly: ${firstReset.data?.code}`,
        ...details
      });
      return;
    }
  }

  // Second reset (should fail with TOKEN_USED)
  console.log('\n--- Second reset (should fail with TOKEN_USED) ---');
  const secondReset = await apiCall('POST', '/api/password-reset/reset', {
    token: previousToken,
    newPassword: 'SecondReset123!@#'
  });
  details.requestIds.secondReset = secondReset.requestId;
  details.secondResetStatus = secondReset.status;
  details.secondResetCode = secondReset.data?.code;

  const passed = secondReset.status === 400 && secondReset.data?.code === 'TOKEN_USED';
  recordResult('Test 2: Used Token', passed, details);
}

// =============================================================================
// TEST 3: Invalidation (Request A, Request B, Verify/Reset A fails)
// =============================================================================
async function test3_Invalidation() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Invalidation (Request A, Request B → A becomes invalid)');
  console.log('='.repeat(70));

  const details = { requestIds: {} };

  // Step 1: Request token A
  console.log('\n--- Step 1: Request token A ---');
  const reqA = await apiCall('POST', '/api/password-reset/request', { email: TEST_EMAIL });
  details.requestIds.requestA = reqA.requestId;

  if (!reqA.data?.devToken) {
    recordResult('Test 3: Invalidation', false, { reason: 'No devToken A returned' });
    return;
  }

  const tokenA = reqA.data.devToken;
  details.tokenA_hashSuffix = reqA.data.devTokenHashSuffix;
  console.log(`    Token A: tokenHashSuffix=${details.tokenA_hashSuffix}`);

  // Step 2: Request token B (should invalidate A)
  console.log('\n--- Step 2: Request token B (should invalidate A) ---');
  const reqB = await apiCall('POST', '/api/password-reset/request', { email: TEST_EMAIL });
  details.requestIds.requestB = reqB.requestId;

  if (!reqB.data?.devToken) {
    recordResult('Test 3: Invalidation', false, { reason: 'No devToken B returned' });
    return;
  }

  const tokenB = reqB.data.devToken;
  details.tokenB_hashSuffix = reqB.data.devTokenHashSuffix;
  console.log(`    Token B: tokenHashSuffix=${details.tokenB_hashSuffix}`);

  // Step 3: Verify token A (should fail - invalidated)
  console.log('\n--- Step 3: Verify token A (should be invalidated) ---');
  const verifyA = await apiCall('GET', `/api/password-reset/verify/${tokenA}`);
  details.requestIds.verifyA = verifyA.requestId;
  details.verifyA_status = verifyA.status;
  details.verifyA_code = verifyA.data?.code;

  // Token A should be invalid (USED because we mark old tokens as used)
  const verifyFailed = verifyA.status === 400 &&
    (verifyA.data?.code === 'TOKEN_USED' || verifyA.data?.code === 'TOKEN_INVALID_OR_EXPIRED');

  // Step 4: Verify token B (should succeed)
  console.log('\n--- Step 4: Verify token B (should still be valid) ---');
  const verifyB = await apiCall('GET', `/api/password-reset/verify/${tokenB}`);
  details.requestIds.verifyB = verifyB.requestId;
  details.verifyB_valid = verifyB.data?.valid;

  const passed = verifyFailed && verifyB.data?.valid === true;
  recordResult('Test 3: Invalidation', passed, details);
}

// =============================================================================
// TEST 4: Invalid Format
// =============================================================================
async function test4_InvalidFormat() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Invalid Token Format');
  console.log('='.repeat(70));

  const details = { requestIds: {} };

  // Test with short token
  console.log('\n--- Test with short token (32 chars instead of 64) ---');
  const shortToken = 'a'.repeat(32);
  const verifyShort = await apiCall('GET', `/api/password-reset/verify/${shortToken}`);
  details.requestIds.verifyShort = verifyShort.requestId;
  details.shortToken_status = verifyShort.status;
  details.shortToken_code = verifyShort.data?.code;

  // Test with invalid characters
  console.log('\n--- Test with invalid characters (has G,H,Z) ---');
  const invalidChars = 'ghz12345' + 'a'.repeat(56);
  const verifyInvalid = await apiCall('GET', `/api/password-reset/verify/${invalidChars}`);
  details.requestIds.verifyInvalid = verifyInvalid.requestId;
  details.invalidChars_status = verifyInvalid.status;
  details.invalidChars_code = verifyInvalid.data?.code;

  // Test with non-existent but valid format token
  console.log('\n--- Test with non-existent valid-format token ---');
  const nonExistent = 'deadbeef'.repeat(8);
  const verifyNonExistent = await apiCall('GET', `/api/password-reset/verify/${nonExistent}`);
  details.requestIds.verifyNonExistent = verifyNonExistent.requestId;
  details.nonExistent_status = verifyNonExistent.status;
  details.nonExistent_code = verifyNonExistent.data?.code;

  const passed =
    verifyShort.status === 400 &&
    verifyInvalid.status === 400 &&
    verifyNonExistent.status === 400;

  recordResult('Test 4: Invalid Format', passed, details);
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           PASSWORD RESET ACCEPTANCE TESTS                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`Started: ${new Date().toISOString()}`);

  // Check server is reachable
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.error('\n❌ Server not reachable at', BASE_URL);
      console.error('   Start the server with: pnpm run dev');
      process.exit(1);
    }
  } catch (e) {
    console.error('\n❌ Server not reachable at', BASE_URL);
    console.error('   Start the server with: pnpm run dev');
    process.exit(1);
  }

  // Run tests
  const token1 = await test1_HappyPath();
  await test2_UsedToken(token1);
  await test3_Invalidation();
  await test4_InvalidFormat();

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('                           SUMMARY');
  console.log('═'.repeat(70));

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.testName}`);
    if (r.details?.requestIds) {
      const ids = Object.entries(r.details.requestIds)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      console.log(`   requestIds: ${ids}`);
    }
    if (r.details?.tokenHashSuffix) {
      console.log(`   tokenHashSuffix: ${r.details.tokenHashSuffix}`);
    }
    if (!r.passed && r.details?.reason) {
      console.log(`   reason: ${r.details.reason}`);
    }
    if (r.passed) passCount++; else failCount++;
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`TOTAL: ${passCount} PASS, ${failCount} FAIL`);
  console.log('═'.repeat(70));

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
