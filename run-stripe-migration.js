import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/theconnection";
const sql = neon(databaseUrl);

console.log('Running Stripe removal migration...');

try {
  // Drop stripe_customer_id column
  console.log('Dropping stripe_customer_id column...');
  await sql`ALTER TABLE organizations DROP COLUMN IF EXISTS stripe_customer_id`;
  
  // Drop stripe_subscription_id column
  console.log('Dropping stripe_subscription_id column...');
  await sql`ALTER TABLE organizations DROP COLUMN IF EXISTS stripe_subscription_id`;
  
  console.log('✅ Migration completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
}
