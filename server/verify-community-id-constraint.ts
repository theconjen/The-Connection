// IMPORTANT: Load dotenv FIRST before any other imports
import "dotenv/config";

import { db } from "./db";
import { sql } from "drizzle-orm";

async function verifyConstraint() {
  try {
    console.log("🔍 Verifying events.community_id constraint...\n");

    // Check the column definition
    const result = await db.execute(sql`
      SELECT
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'events'
        AND column_name = 'community_id'
    `);

    if (result.rows.length === 0) {
      console.log("❌ Column not found!");
      return;
    }

    const column = result.rows[0] as any;
    console.log("Column Information:");
    console.log("  Name:", column.column_name);
    console.log("  Nullable:", column.is_nullable);
    console.log("  Type:", column.data_type);
    console.log("  Default:", column.column_default || "none");

    if (column.is_nullable === "NO") {
      console.log("\n✅ SUCCESS: community_id is now required (NOT NULL)");
    } else {
      console.log("\n❌ FAILED: community_id is still nullable");
    }

    // Also check for foreign key constraint
    const fkResult = await db.execute(sql`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'events'
        AND kcu.column_name = 'community_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    if (fkResult.rows.length > 0) {
      const fk = fkResult.rows[0] as any;
      console.log("\nForeign Key Constraint:");
      console.log("  References:", `${fk.foreign_table_name}.${fk.foreign_column_name}`);
      console.log("  ✅ Foreign key constraint exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

verifyConstraint();
