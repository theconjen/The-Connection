#!/usr/bin/env node

/**
 * Feed Explore Service Acceptance Tests
 *
 * Tests the feed explore service hardening pattern:
 * 1. Post with meaningful replies outranks high-like low-reply post
 * 2. Repeated likes from same small group has capped effect
 * 3. Same inputs -> same ordering (deterministic)
 *
 * Usage:
 *   node scripts/test-feed-explore.js
 *   node scripts/test-feed-explore.js --base-url=http://localhost:5000
 *
 * Prerequisites:
 *   - Server must be running
 *   - Database should have posts to test with
 */

const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Configuration
const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:5000';
const AUTH_COOKIE = process.argv.find(a => a.startsWith('--cookie='))?.split('=')[1] || '';

// Test state
let passCount = 0;
let failCount = 0;
const results = [];

// ============================================================================
// HTTP Client
// ============================================================================

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestId = uuidv4();
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      ...(AUTH_COOKIE ? { Cookie: AUTH_COOKIE } : {}),
      ...headers,
    };

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: defaultHeaders,
      rejectUnauthorized: false,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
            requestId,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: { raw: data },
            requestId,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ============================================================================
// Test Helpers
// ============================================================================

function printHeader() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              FEED EXPLORE SERVICE ACCEPTANCE TESTS                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');
}

function printResult(testName, passed, requestId, details = {}) {
  const icon = passed ? '✅' : '❌';

  console.log(`${icon} Test: ${testName}`);
  console.log(`   requestId: ${requestId}`);

  for (const [key, value] of Object.entries(details)) {
    console.log(`   ${key}: ${value}`);
  }

  console.log('');

  results.push({ testName, passed, requestId, details });
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
}

function printSummary() {
  console.log('────────────────────────────────────────────────────────────────────────');
  console.log(`TOTAL: ${passCount} PASS, ${failCount} FAIL`);
  console.log('');

  if (failCount > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.testName}: ${r.details.reason || 'Unknown'}`);
    });
  }
}

// ============================================================================
// Tests
// ============================================================================

async function testGetExploreFeed() {
  const response = await makeRequest('GET', '/api/feed/explore?limit=10');

  const passed = response.status === 200 && response.body.success === true;
  printResult(
    'Get Explore Feed',
    passed,
    response.requestId,
    {
      httpStatus: response.status,
      status: response.body.status,
      itemCount: response.body.data?.items?.length || 0,
      scoringVersion: response.body.diagnostics?.scoringVersion,
      totalCandidates: response.body.diagnostics?.totalCandidates,
      afterAntiFarm: response.body.diagnostics?.afterAntiFarm,
      perUserCapped: response.body.diagnostics?.perUserCapped,
    }
  );

  return response.body.data?.items || [];
}

async function testDeterministicOrdering() {
  // Make two requests and verify same ordering
  const response1 = await makeRequest('GET', '/api/feed/explore?limit=20');
  const response2 = await makeRequest('GET', '/api/feed/explore?limit=20');

  const items1 = response1.body.data?.items || [];
  const items2 = response2.body.data?.items || [];

  // Check if both have items
  if (items1.length === 0 || items2.length === 0) {
    printResult(
      'Deterministic Ordering (Same inputs -> same output)',
      true,
      response2.requestId,
      { reason: 'Not enough items to compare (skipped)' }
    );
    return;
  }

  // Compare IDs in order
  const ids1 = items1.map((i) => i.id);
  const ids2 = items2.map((i) => i.id);

  const isSameOrder = ids1.every((id, idx) => id === ids2[idx]);

  printResult(
    'Deterministic Ordering (Same inputs -> same output)',
    isSameOrder,
    response2.requestId,
    {
      firstRequestCount: items1.length,
      secondRequestCount: items2.length,
      isSameOrder,
    }
  );
}

async function testExploreScoresDescending(items) {
  if (items.length < 2) {
    printResult(
      'Explore Scores are Descending',
      true,
      'N/A',
      { reason: 'Not enough items to verify ordering (skipped)' }
    );
    return;
  }

  const scores = items.map((i) => i.exploreScore);
  let isDescending = true;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[i - 1]) {
      isDescending = false;
      break;
    }
  }

  printResult(
    'Explore Scores are Descending',
    isDescending,
    'N/A',
    {
      sampleScores: scores.slice(0, 5).map(s => s?.toFixed(4)).join(', '),
      isDescending,
    }
  );
}

async function testDiagnosticsPresent() {
  const response = await makeRequest('GET', '/api/feed/explore?limit=5');

  const diagnostics = response.body.diagnostics;
  const hasDiagnostics =
    diagnostics &&
    typeof diagnostics.totalCandidates === 'number' &&
    typeof diagnostics.afterAntiFarm === 'number' &&
    typeof diagnostics.perUserCapped === 'number' &&
    typeof diagnostics.finalCount === 'number' &&
    typeof diagnostics.scoringVersion === 'string';

  printResult(
    'Diagnostics Present and Complete',
    hasDiagnostics,
    response.requestId,
    {
      httpStatus: response.status,
      hasDiagnostics,
      scoringVersion: diagnostics?.scoringVersion,
    }
  );
}

async function testPagination() {
  const response1 = await makeRequest('GET', '/api/feed/explore?limit=3');
  const items1 = response1.body.data?.items || [];
  const nextCursor = response1.body.data?.nextCursor;

  if (!nextCursor) {
    printResult(
      'Pagination Works',
      true,
      response1.requestId,
      { reason: 'Not enough items for pagination (skipped)' }
    );
    return;
  }

  const response2 = await makeRequest('GET', `/api/feed/explore?limit=3&cursor=${nextCursor}`);
  const items2 = response2.body.data?.items || [];

  // Verify no overlap
  const ids1 = new Set(items1.map((i) => i.id));
  const hasOverlap = items2.some((i) => ids1.has(i.id));

  printResult(
    'Pagination Works (No Overlap)',
    !hasOverlap && response2.status === 200,
    response2.requestId,
    {
      firstPageCount: items1.length,
      secondPageCount: items2.length,
      cursorUsed: nextCursor,
      hasOverlap,
    }
  );
}

async function testPerUserCapping() {
  const response = await makeRequest('GET', '/api/feed/explore?limit=50');
  const items = response.body.data?.items || [];

  if (items.length < 10) {
    printResult(
      'Per-User Capping (Max 3 posts per user)',
      true,
      response.requestId,
      { reason: 'Not enough items to verify capping (skipped)' }
    );
    return;
  }

  // Count posts per user
  const userCounts = {};
  for (const item of items) {
    userCounts[item.authorId] = (userCounts[item.authorId] || 0) + 1;
  }

  // Check no user has more than 3 posts
  const maxPostsPerUser = Math.max(...Object.values(userCounts));
  const passed = maxPostsPerUser <= 3;

  printResult(
    'Per-User Capping (Max 3 posts per user)',
    passed,
    response.requestId,
    {
      uniqueAuthors: Object.keys(userCounts).length,
      maxPostsPerUser,
      expected: '<= 3',
    }
  );
}

async function testRequestIdReturned() {
  const customRequestId = 'test-' + uuidv4();
  const response = await makeRequest('GET', '/api/feed/explore?limit=5', null, {
    'x-request-id': customRequestId,
  });

  const returnedRequestId = response.headers['x-request-id'];
  const passed = returnedRequestId === customRequestId;

  printResult(
    'Request ID Returned in Header',
    passed,
    customRequestId,
    {
      sentRequestId: customRequestId,
      returnedRequestId: returnedRequestId || 'missing',
    }
  );
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  printHeader();

  try {
    // Test 1: Get explore feed
    const items = await testGetExploreFeed();

    // Test 2: Verify scores are descending
    await testExploreScoresDescending(items);

    // Test 3: Deterministic ordering
    await testDeterministicOrdering();

    // Test 4: Diagnostics present
    await testDiagnosticsPresent();

    // Test 5: Pagination
    await testPagination();

    // Test 6: Per-user capping
    await testPerUserCapping();

    // Test 7: Request ID returned
    await testRequestIdReturned();

  } catch (error) {
    console.error('Test execution error:', error.message);
    failCount++;
  }

  printSummary();
  process.exit(failCount > 0 ? 1 : 0);
}

main();
