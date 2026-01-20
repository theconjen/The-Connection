/**
 * Seed script for prayer requests and responses
 */
import { db } from "./db";
import { pool } from "./db";

export async function seedPrayers() {
  
  try {
    // Check if prayer requests already exist
    const prayerRequestsResult = await pool.query(`SELECT COUNT(*) FROM prayer_requests`);
    if (prayerRequestsResult.rows[0].count > 0) {
      return;
    }

    // Get the demo user
    const demoUserResult = await pool.query(`SELECT id FROM users WHERE username = 'demo' LIMIT 1`);
    if (demoUserResult.rows.length === 0) {
      return;
    }
    
    const demoUserId = demoUserResult.rows[0].id;
    
    // Get prayer community
    const prayerCommunityResult = await pool.query(`
      SELECT id FROM communities WHERE slug = 'prayer-requests' LIMIT 1
    `);
    
    let communityId = null;
    if (prayerCommunityResult.rows.length > 0) {
      communityId = prayerCommunityResult.rows[0].id;
    } else {
    }

    // Create prayer requests
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
    

    // Add prayer responses
    for (const prayer of insertedPrayers) {
      // Each prayer request gets 3-5 prayers
      const prayerCount = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
      
      for (let i = 0; i < prayerCount; i++) {
        const message = i % 2 === 0 ? 
          "Praying for you during this time. May God provide exactly what you need." : 
          "I'm lifting this up in prayer. Standing with you in faith.";
        
        await pool.query(`
          INSERT INTO prayers (prayer_request_id, user_id, message, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [prayer.id, demoUserId, message]);
      }
      
      // Update the prayer count
      await pool.query(`
        UPDATE prayer_requests
        SET prayer_count = $1
        WHERE id = $2
      `, [prayerCount, prayer.id]);
    }

    // Mark one prayer request as answered
    const answeredPrayer = insertedPrayers[1]; // The job interview prayer
    await pool.query(`
      UPDATE prayer_requests
      SET is_answered = true, 
          answered_description = $1
      WHERE id = $2
    `, [
      "Update: I got the job! Thank you all for your prayers. I start next month and am so grateful for God's provision.",
      answeredPrayer.id
    ]);
    
  } catch (error) {
    console.error("Error seeding prayer requests:", error);
  }
}

// Run this directly if called directly
// if (import.meta.url === new URL(import.meta.url).href) {
//   seedPrayers()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error("Failed to seed prayer request data:", error);
//       process.exit(1);
//     });
// }