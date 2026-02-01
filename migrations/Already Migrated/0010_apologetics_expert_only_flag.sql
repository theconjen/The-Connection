-- Add flag to indicate which apologetics questions require a verified answerer
ALTER TABLE apologetics_questions
ADD COLUMN IF NOT EXISTS requires_verified_answerer boolean NOT NULL DEFAULT false;
