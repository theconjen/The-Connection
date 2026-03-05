-- Add invite_code column to communities table for shareable invite links
ALTER TABLE communities ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
