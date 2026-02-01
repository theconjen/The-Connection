/**
 * Assign expertise categories to an apologist
 *
 * Usage:
 *   npx tsx server/assign-apologist-expertise.ts <userId> <areaId> [tagId] [level]
 *
 * Examples:
 *   # Assign user 19 to area 1 (all tags in that area) as primary expert
 *   npx tsx server/assign-apologist-expertise.ts 19 1 --level=primary
 *
 *   # Assign user 19 to area 1, tag 5 as secondary expert
 *   npx tsx server/assign-apologist-expertise.ts 19 1 5 --level=secondary
 *
 *   # List all areas and tags
 *   npx tsx server/assign-apologist-expertise.ts --list
 *
 *   # Show expertise for a user
 *   npx tsx server/assign-apologist-expertise.ts --show 19
 *
 *   # Setup full apologist (creates profile, grants permission, enables inbox)
 *   npx tsx server/assign-apologist-expertise.ts --setup 19
 */

import "dotenv/config";
import { db } from './db';
import {
  users,
  userPermissions,
  apologistProfiles,
  apologistExpertise,
  qaAreas,
  qaTags
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function listAreasAndTags() {
  console.log('\n📚 Available Areas and Tags:\n');

  const areas = await db.select().from(qaAreas);
  const tags = await db.select().from(qaTags);

  for (const area of areas) {
    console.log(`  Area ${area.id}: ${area.name} (${area.domain})`);
    const areaTags = tags.filter(t => t.areaId === area.id);
    for (const tag of areaTags) {
      console.log(`    └─ Tag ${tag.id}: ${tag.name}`);
    }
  }

  if (areas.length === 0) {
    console.log('  No areas found. Run seed scripts first.');
  }
}

async function showUserExpertise(userId: number) {
  console.log(`\n👤 Expertise for User ${userId}:\n`);

  const user = await db.select().from(users).where(eq(users.id, userId));
  if (user.length === 0) {
    console.log(`  ❌ User ${userId} not found`);
    return;
  }

  console.log(`  User: ${user[0].displayName || user[0].username} (${user[0].email})`);

  // Check permissions
  const permissions = await db
    .select()
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));

  console.log(`  Permissions: ${permissions.map(p => p.permission).join(', ') || 'none'}`);

  // Check profile
  const profile = await db
    .select()
    .from(apologistProfiles)
    .where(eq(apologistProfiles.userId, userId));

  if (profile.length > 0) {
    console.log(`  Profile: ${profile[0].title || 'No title'} - ${profile[0].credentialsShort || 'No credentials'}`);
    console.log(`  Inbox Enabled: ${profile[0].inboxEnabled ? '✅ Yes' : '❌ No'}`);
  } else {
    console.log('  Profile: ❌ Not created');
  }

  // Check expertise
  const expertise = await db
    .select({
      id: apologistExpertise.id,
      areaId: apologistExpertise.areaId,
      tagId: apologistExpertise.tagId,
      level: apologistExpertise.level,
      areaName: qaAreas.name,
      tagName: qaTags.name,
    })
    .from(apologistExpertise)
    .leftJoin(qaAreas, eq(apologistExpertise.areaId, qaAreas.id))
    .leftJoin(qaTags, eq(apologistExpertise.tagId, qaTags.id))
    .where(eq(apologistExpertise.userId, userId));

  console.log('\n  Expertise:');
  if (expertise.length === 0) {
    console.log('    No expertise assigned');
  } else {
    for (const exp of expertise) {
      const tagInfo = exp.tagName ? `→ ${exp.tagName}` : '(all tags)';
      console.log(`    [${exp.level}] ${exp.areaName} ${tagInfo}`);
    }
  }
}

async function setupApologist(userId: number) {
  console.log(`\n🔧 Setting up apologist for User ${userId}...\n`);

  const user = await db.select().from(users).where(eq(users.id, userId));
  if (user.length === 0) {
    console.log(`  ❌ User ${userId} not found`);
    return;
  }

  console.log(`  User: ${user[0].displayName || user[0].username}`);

  // 1. Grant inbox_access permission
  const existingPermission = await db
    .select()
    .from(userPermissions)
    .where(and(
      eq(userPermissions.userId, userId),
      eq(userPermissions.permission, 'inbox_access')
    ));

  if (existingPermission.length === 0) {
    await db.insert(userPermissions).values({
      userId,
      permission: 'inbox_access',
      grantedBy: userId,
      grantedAt: new Date(),
    } as any);
    console.log('  ✅ Granted inbox_access permission');
  } else {
    console.log('  ℹ️  inbox_access permission already exists');
  }

  // 2. Create or update apologist profile
  const existingProfile = await db
    .select()
    .from(apologistProfiles)
    .where(eq(apologistProfiles.userId, userId));

  if (existingProfile.length === 0) {
    await db.insert(apologistProfiles).values({
      userId,
      inboxEnabled: true,
    } as any);
    console.log('  ✅ Created apologist profile with inbox enabled');
  } else if (!existingProfile[0].inboxEnabled) {
    await db
      .update(apologistProfiles)
      .set({ inboxEnabled: true })
      .where(eq(apologistProfiles.userId, userId));
    console.log('  ✅ Enabled inbox for existing profile');
  } else {
    console.log('  ℹ️  Apologist profile already exists with inbox enabled');
  }

  console.log('\n  ✅ Apologist setup complete!');
  console.log('  Next: Assign expertise with:');
  console.log(`    npx tsx server/assign-apologist-expertise.ts ${userId} <areaId> [tagId] --level=primary`);
}

async function assignExpertise(userId: number, areaId: number, tagId: number | null, level: string) {
  console.log(`\n📝 Assigning expertise to User ${userId}...\n`);

  // Verify user exists
  const user = await db.select().from(users).where(eq(users.id, userId));
  if (user.length === 0) {
    console.log(`  ❌ User ${userId} not found`);
    return;
  }

  // Verify area exists
  const area = await db.select().from(qaAreas).where(eq(qaAreas.id, areaId));
  if (area.length === 0) {
    console.log(`  ❌ Area ${areaId} not found`);
    return;
  }

  // Verify tag exists (if provided)
  if (tagId !== null) {
    const tag = await db.select().from(qaTags).where(eq(qaTags.id, tagId));
    if (tag.length === 0) {
      console.log(`  ❌ Tag ${tagId} not found`);
      return;
    }
  }

  // Check if expertise already exists
  const existing = await db
    .select()
    .from(apologistExpertise)
    .where(and(
      eq(apologistExpertise.userId, userId),
      eq(apologistExpertise.areaId, areaId),
      tagId === null
        ? eq(apologistExpertise.tagId, null as any)
        : eq(apologistExpertise.tagId, tagId)
    ));

  if (existing.length > 0) {
    // Update level if different
    if (existing[0].level !== level) {
      await db
        .update(apologistExpertise)
        .set({ level })
        .where(eq(apologistExpertise.id, existing[0].id));
      console.log(`  ✅ Updated expertise level to ${level}`);
    } else {
      console.log(`  ℹ️  Expertise already exists with level ${level}`);
    }
  } else {
    await db.insert(apologistExpertise).values({
      userId,
      areaId,
      tagId,
      level,
    } as any);
    console.log(`  ✅ Added expertise: Area ${areaId}${tagId ? `, Tag ${tagId}` : ' (all tags)'} as ${level}`);
  }

  // Show updated expertise
  await showUserExpertise(userId);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Apologist Expertise Manager

Usage:
  npx tsx server/assign-apologist-expertise.ts <userId> <areaId> [tagId] [--level=primary|secondary]
  npx tsx server/assign-apologist-expertise.ts --list
  npx tsx server/assign-apologist-expertise.ts --show <userId>
  npx tsx server/assign-apologist-expertise.ts --setup <userId>

Options:
  --list              List all areas and tags
  --show <userId>     Show expertise for a user
  --setup <userId>    Setup user as apologist (grant permission, create profile, enable inbox)
  --level=<level>     Expertise level: primary or secondary (default: primary)

Examples:
  # Setup Janelle as an apologist
  npx tsx server/assign-apologist-expertise.ts --setup 19

  # Assign Janelle to "God's Existence" area (all tags) as primary
  npx tsx server/assign-apologist-expertise.ts 19 1 --level=primary

  # Assign Janelle to specific tag within an area
  npx tsx server/assign-apologist-expertise.ts 19 1 3 --level=secondary
`);
    process.exit(0);
  }

  try {
    if (args.includes('--list')) {
      await listAreasAndTags();
    } else if (args.includes('--show')) {
      const userIdIndex = args.indexOf('--show') + 1;
      const userId = parseInt(args[userIdIndex]);
      if (isNaN(userId)) {
        console.log('❌ Please provide a valid user ID after --show');
        process.exit(1);
      }
      await showUserExpertise(userId);
    } else if (args.includes('--setup')) {
      const userIdIndex = args.indexOf('--setup') + 1;
      const userId = parseInt(args[userIdIndex]);
      if (isNaN(userId)) {
        console.log('❌ Please provide a valid user ID after --setup');
        process.exit(1);
      }
      await setupApologist(userId);
    } else {
      // Assign expertise
      const userId = parseInt(args[0]);
      const areaId = parseInt(args[1]);

      if (isNaN(userId) || isNaN(areaId)) {
        console.log('❌ Please provide valid userId and areaId');
        process.exit(1);
      }

      // Check for tagId (optional, non-flag argument)
      let tagId: number | null = null;
      if (args[2] && !args[2].startsWith('--')) {
        tagId = parseInt(args[2]);
        if (isNaN(tagId)) tagId = null;
      }

      // Check for level flag
      let level = 'primary';
      const levelArg = args.find(a => a.startsWith('--level='));
      if (levelArg) {
        level = levelArg.split('=')[1];
        if (level !== 'primary' && level !== 'secondary') {
          console.log('❌ Level must be "primary" or "secondary"');
          process.exit(1);
        }
      }

      await assignExpertise(userId, areaId, tagId, level);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
