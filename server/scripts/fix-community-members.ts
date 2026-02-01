/**
 * Fix Community Memberships
 * Removes members who don't match community gender filters
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Male bot usernames
const MALE_BOTS = ['mike_worshipguy', 'pastor_dave', 'running4jesus', 'blue_collar_believer'];

// Female bot usernames
const FEMALE_BOTS = ['sarah_momof3', 'grace_in_progress', 'teacher_tina', 'military_wife_strong', 'empty_nest_nancy'];

async function fixMemberships() {
  console.info('\n🔧 Fixing community memberships...\n');

  // Remove male bots from Women's communities
  const womensCommunities = await db.execute(sql`
    SELECT id, name FROM communities WHERE gender = ${"Women's Only"}
  `);

  const maleBotsList = `{${MALE_BOTS.join(',')}}`;

  for (const comm of (womensCommunities.rows || []) as { id: number; name: string }[]) {
    const result = await db.execute(sql`
      DELETE FROM community_members
      WHERE community_id = ${comm.id}
      AND user_id IN (
        SELECT id FROM users WHERE username = ANY(${maleBotsList}::text[])
      )
      RETURNING user_id
    `);
    const removed = result.rows?.length || 0;
    if (removed > 0) {
      console.info(`✅ Removed ${removed} male members from "${comm.name}"`);
    }
  }

  // Remove female bots from Men's communities
  const mensCommunities = await db.execute(sql`
    SELECT id, name FROM communities WHERE gender = ${"Men's Only"}
  `);

  const femaleBotsList = `{${FEMALE_BOTS.join(',')}}`;

  for (const comm of (mensCommunities.rows || []) as { id: number; name: string }[]) {
    const result = await db.execute(sql`
      DELETE FROM community_members
      WHERE community_id = ${comm.id}
      AND user_id IN (
        SELECT id FROM users WHERE username = ANY(${femaleBotsList}::text[])
      )
      RETURNING user_id
    `);
    const removed = result.rows?.length || 0;
    if (removed > 0) {
      console.info(`✅ Removed ${removed} female members from "${comm.name}"`);
    }
  }

  // Update member counts
  await db.execute(sql`
    UPDATE communities c
    SET member_count = (
      SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id
    )
  `);

  console.info('\n✨ Member counts updated!\n');
}

fixMemberships().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
