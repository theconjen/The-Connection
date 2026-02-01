-- Create notifications table

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  category text DEFAULT 'feed', -- dm | community | forum | feed
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
