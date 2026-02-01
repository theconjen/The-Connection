/**
 * Cleanup Bad Posts
 * Removes reply-like content that was accidentally posted as top-level questions
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function cleanup() {
  console.info('\n🧹 Cleaning up bad advice posts...\n');

  // Delete posts that are clearly replies (short encouraging messages) but posted as questions
  const result = await db.execute(sql`
    DELETE FROM microblogs
    WHERE parent_id IS NULL
    AND topic = 'QUESTION'
    AND (
      content LIKE 'So glad you asked%'
      OR content LIKE 'Such a good question%'
      OR content LIKE 'For me, the breakthrough%'
      OR content LIKE 'What helped me was starting small%'
      OR content LIKE 'Praying for you%'
      OR content LIKE 'This is so relatable%'
      OR content LIKE 'Needed this today%'
      OR content LIKE 'Same here%'
      OR content LIKE 'Amen to this%'
      OR content LIKE 'Thank you for your honesty%'
      OR content LIKE 'Me too, friend%'
      OR content LIKE 'Right there with you%'
      OR content LIKE 'God sees you%'
      OR content LIKE 'Lifting you up%'
      OR content LIKE 'Been there. It gets better%'
      OR content LIKE 'I''d recommend talking to%'
      OR content LIKE 'One thing that shifted%'
      OR content LIKE 'Community has been huge%'
      OR content LIKE 'I learned to give myself%'
      OR content LIKE 'What worked for me%'
      OR content LIKE 'Sometimes the answer is simpler%'
      OR content LIKE 'My pastor gave me%'
      OR content LIKE 'Have you tried journaling%'
      OR content LIKE 'This verse has gotten me%'
      OR content LIKE 'Something that''s been anchoring%'
      OR content LIKE 'I keep coming back to%'
      OR content LIKE 'One of my favorites%'
      OR content LIKE 'Not sure if this helps%'
      OR content LIKE 'When I feel like this%'
      OR (LENGTH(content) < 40 AND content NOT LIKE '%?%')
    )
    RETURNING id, content
  `);

  const deleted = result.rows || [];
  console.info(`✅ Deleted ${deleted.length} bad posts:\n`);

  for (const row of deleted.slice(0, 10) as { id: number; content: string }[]) {
    console.info(`   - "${row.content.substring(0, 50)}..."`);
  }

  if (deleted.length > 10) {
    console.info(`   ... and ${deleted.length - 10} more`);
  }
}

cleanup().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
