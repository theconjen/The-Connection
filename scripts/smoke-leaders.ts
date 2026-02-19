#!/usr/bin/env npx tsx
/**
 * Smoke test for Organization Leaders API
 * Tests CRUD operations on the leaders endpoints
 *
 * Usage: pnpm run smoke:leaders
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

interface Leader {
  id: number;
  organizationId: number;
  name: string;
  title?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  isPublic: boolean;
  sortOrder: number;
}

// Simple fetch wrapper with cookie handling
let sessionCookie = '';

async function request(
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Capture session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.info(`PASS: ${message}`);
}

async function main() {
  console.info('=== Organization Leaders Smoke Test ===\n');
  console.info(`Testing against: ${BASE_URL}\n`);

  // Step 1: Login as admin
  console.info('Step 1: Login as admin user...');
  const loginResult = await request('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'admin123',
  });

  if (loginResult.status !== 200) {
    console.info('Note: Could not login with admin@example.com. Testing public endpoints only.');
  } else {
    console.info('Logged in successfully.\n');
  }

  // Step 2: Get an organization to test with
  console.info('Step 2: Find an organization...');
  const directoryResult = await request('GET', '/api/orgs/directory?limit=1');

  if (directoryResult.status !== 200 || !directoryResult.data?.items?.length) {
    console.info('No organizations found in directory. Skipping leader tests.');
    console.info('\n=== Smoke Test Complete (Partial) ===');
    process.exit(0);
  }

  const testOrg = directoryResult.data.items[0];
  console.info(`Using organization: ${testOrg.name} (slug: ${testOrg.slug})\n`);

  // Step 3: Test public profile includes leaders array
  console.info('Step 3: Test public profile includes leaders...');
  const profileResult = await request('GET', `/api/orgs/${testOrg.slug}`);
  assert(profileResult.status === 200, 'Public profile returns 200');
  assert(Array.isArray(profileResult.data?.leaders), 'Profile includes leaders array');
  console.info(`Found ${profileResult.data.leaders.length} public leaders.\n`);

  // Step 4: Test org-admin leaders endpoint (if logged in as admin)
  if (sessionCookie) {
    console.info('Step 4: Test org-admin leaders endpoint...');
    const adminLeadersResult = await request('GET', `/api/org-admin/${testOrg.id}/leaders`);

    if (adminLeadersResult.status === 200) {
      console.info(`Found ${adminLeadersResult.data.length} total leaders (admin view).\n`);

      // Step 5: Create a test leader
      console.info('Step 5: Create a test leader...');
      const testLeaderData = {
        name: `Test Leader ${Date.now()}`,
        title: 'Test Pastor',
        bio: 'This is a smoke test leader',
        isPublic: false,
        sortOrder: 999,
      };

      const createResult = await request('POST', `/api/org-admin/${testOrg.id}/leaders`, testLeaderData);
      assert(createResult.status === 201, 'Leader created with 201 status');
      assert(createResult.data?.id, 'Created leader has ID');
      const createdLeader = createResult.data as Leader;
      console.info(`Created leader ID: ${createdLeader.id}\n`);

      // Step 6: Update the leader
      console.info('Step 6: Update the leader...');
      const updateResult = await request('PATCH', `/api/org-admin/${testOrg.id}/leaders/${createdLeader.id}`, {
        title: 'Updated Test Pastor',
        isPublic: true,
      });
      assert(updateResult.status === 200, 'Leader updated with 200 status');
      assert(updateResult.data?.title === 'Updated Test Pastor', 'Leader title was updated');
      assert(updateResult.data?.isPublic === true, 'Leader visibility was updated');
      console.info('Leader updated successfully.\n');

      // Step 7: Verify leader appears in public profile
      console.info('Step 7: Verify leader appears in public profile...');
      const updatedProfileResult = await request('GET', `/api/orgs/${testOrg.slug}`);
      const publicLeaders = updatedProfileResult.data?.leaders || [];
      const foundInPublic = publicLeaders.some((l: any) => l.id === createdLeader.id);
      assert(foundInPublic, 'Updated leader appears in public profile');
      console.info('Leader is visible in public profile.\n');

      // Step 8: Delete the leader
      console.info('Step 8: Delete the test leader...');
      const deleteResult = await request('DELETE', `/api/org-admin/${testOrg.id}/leaders/${createdLeader.id}`);
      assert(deleteResult.status === 200, 'Leader deleted with 200 status');
      console.info('Leader deleted successfully.\n');

      // Step 9: Verify leader no longer appears
      console.info('Step 9: Verify leader no longer appears...');
      const finalProfileResult = await request('GET', `/api/orgs/${testOrg.slug}`);
      const finalLeaders = finalProfileResult.data?.leaders || [];
      const stillExists = finalLeaders.some((l: any) => l.id === createdLeader.id);
      assert(!stillExists, 'Deleted leader no longer appears in public profile');
      console.info('Leader cleanup confirmed.\n');
    } else if (adminLeadersResult.status === 404) {
      console.info('Not an admin of this organization. Skipping admin tests.\n');
    } else {
      console.info(`Unexpected status ${adminLeadersResult.status}. Skipping admin tests.\n`);
    }
  }

  // Step 10: Verify public leaders DTO only contains safe fields
  console.info('Step 10: Verify public leader DTO safety...');
  const safeFieldsCheck = await request('GET', `/api/orgs/${testOrg.slug}`);
  const publicLeadersDTO = safeFieldsCheck.data?.leaders || [];
  if (publicLeadersDTO.length > 0) {
    const leader = publicLeadersDTO[0];
    const allowedFields = ['id', 'name', 'title', 'bio', 'photoUrl', 'sortOrder'];
    const forbiddenFields = ['email', 'phone', 'address', 'organizationId', 'isPublic', 'createdAt', 'updatedAt'];

    const hasOnlyAllowedFields = Object.keys(leader).every(k => allowedFields.includes(k));
    const hasNoForbiddenFields = !Object.keys(leader).some(k => forbiddenFields.includes(k));

    assert(hasOnlyAllowedFields, 'Public leader has only allowed fields');
    assert(hasNoForbiddenFields, 'Public leader has no forbidden fields');
  } else {
    console.info('No public leaders to check. Skipping field safety check.\n');
  }

  console.info('\n=== Smoke Test Complete ===');
  console.info('All tests passed!');
}

main().catch((err) => {
  console.error('Smoke test failed with error:', err);
  process.exit(1);
});
