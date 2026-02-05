-- Migration: Rename org tiers from standard/premium to stewardship/partner
-- Date: 2026-02-05
-- Description: Updates tier naming in org_billing and organizations tables

-- Update org_billing table
UPDATE org_billing SET tier = 'stewardship' WHERE tier = 'standard';
UPDATE org_billing SET tier = 'partner' WHERE tier = 'premium';

-- Update organizations table (legacy plan field)
UPDATE organizations SET plan = 'stewardship' WHERE plan = 'standard';
UPDATE organizations SET plan = 'partner' WHERE plan = 'premium';

-- Update CHECK constraints on org_billing.tier/status (if exist)
ALTER TABLE org_billing DROP CONSTRAINT IF EXISTS org_billing_tier_check;
ALTER TABLE org_billing ADD CONSTRAINT org_billing_tier_check CHECK (tier IN ('free', 'stewardship', 'partner'));

ALTER TABLE org_billing DROP CONSTRAINT IF EXISTS org_billing_status_check;
ALTER TABLE org_billing ADD CONSTRAINT org_billing_status_check CHECK (status IN ('inactive', 'trialing', 'active', 'past_due', 'canceled'));

-- Note: Run `pnpm run db:push` after this migration to sync schema constraints
