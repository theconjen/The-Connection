import { pool } from "./db.js";
async function seedPrayers() {
  console.log("Starting prayer request data seeding...");
  try {
    const prayerRequestsResult = await pool.query(`SELECT COUNT(*) FROM prayer_requests`);
    if (prayerRequestsResult.rows[0].count > 0) {
      console.log("Prayer requests already exist, skipping seeding");
      return;
    }
    const demoUserResult = await pool.query(`SELECT id FROM users WHERE username = 'demo' LIMIT 1`);
    if (demoUserResult.rows.length === 0) {
      console.log("Demo user not found, cannot seed prayer requests");
      return;
    }
    const demoUserId = demoUserResult.rows[0].id;
    console.log(`Found demo user with ID: ${demoUserId}, will use as prayer request creator`);
    const prayerCommunityResult = await pool.query(`
      SELECT id FROM communities WHERE slug = 'prayer-requests' LIMIT 1
    `);
    let communityId = null;
    if (prayerCommunityResult.rows.length > 0) {
      communityId = prayerCommunityResult.rows[0].id;
      console.log(`Found prayer community with ID: ${communityId}`);
    } else {
      console.log("Prayer community not found");
    }
    const prayerRequestData = [
      {
        title: "Health concerns for my mother",
        content: "My mother is undergoing some medical tests for a concerning health issue. Please pray for accurate diagnosis, effective treatment options, and peace of mind for her and our family during this uncertain time.",
        author_id: demoUserId,
        privacy_level: "public",
        is_anonymous: false
      },
      {
        title: "Job interview next week",
        content: "I have an important job interview next week that would be a significant step forward in my career. Please pray for clarity of mind, confidence, and that God's will would be done in this situation.",
        author_id: demoUserId,
        privacy_level: "public",
        is_anonymous: false
      },
      {
        title: "Marriage restoration",
        content: "My spouse and I have been going through a difficult time in our marriage. Please pray for healing, restored communication, and that we would both have hearts open to forgiveness and reconciliation.",
        author_id: demoUserId,
        privacy_level: "public",
        is_anonymous: true
      },
      {
        title: "Wisdom for important decision",
        content: "I'm facing a major life decision that will affect my family's future. Please pray that God would grant me wisdom, clear guidance, and peace about which path to take.",
        author_id: demoUserId,
        privacy_level: "public",
        is_anonymous: false
      },
      {
        title: "Financial breakthrough needed",
        content: "Our family is experiencing financial strain due to unexpected expenses and reduced income. Please pray for provision, wisdom in managing our resources, and potential new opportunities.",
        author_id: demoUserId,
        privacy_level: "public",
        is_anonymous: false
      },
      {
        title: "Prayer for my child's faith",
        content: "My teenage child is questioning their faith and moving away from church involvement. Please pray that God would work in their heart, that they would encounter Christ in a meaningful way, and that I would have wisdom in how to support them through this time.",
        author_id: demoUserId,
        privacy_level: "public",
        is_anonymous: false
      }
    ];
    console.log("Creating prayer requests...");
    const insertedPrayers = [];
    for (const prayer of prayerRequestData) {
      const result = await pool.query(`
        INSERT INTO prayer_requests 
        (title, content, author_id, privacy_level, is_anonymous, prayer_count, is_answered, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id
      `, [
        prayer.title,
        prayer.content,
        prayer.author_id,
        prayer.privacy_level,
        prayer.is_anonymous,
        0,
        false
      ]);
      insertedPrayers.push({
        id: result.rows[0].id,
        ...prayer
      });
    }
    console.log(`Created ${insertedPrayers.length} prayer requests`);
    for (const prayer of insertedPrayers) {
      const prayerCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < prayerCount; i++) {
        const message = i % 2 === 0 ? "Praying for you during this time. May God provide exactly what you need." : "I'm lifting this up in prayer. Standing with you in faith.";
        await pool.query(`
          INSERT INTO prayers (prayer_request_id, user_id, message, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [prayer.id, demoUserId, message]);
      }
      await pool.query(`
        UPDATE prayer_requests
        SET prayer_count = $1
        WHERE id = $2
      `, [prayerCount, prayer.id]);
    }
    const answeredPrayer = insertedPrayers[1];
    await pool.query(`
      UPDATE prayer_requests
      SET is_answered = true, 
          answered_description = $1
      WHERE id = $2
    `, [
      "Update: I got the job! Thank you all for your prayers. I start next month and am so grateful for God's provision.",
      answeredPrayer.id
    ]);
    console.log("Marked one prayer request as answered");
    console.log("Prayer request data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding prayer requests:", error);
  }
}
export {
  seedPrayers
};
