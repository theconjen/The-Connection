-- Track individual post and comment upvotes and enforce unique RSVPs

CREATE TABLE IF NOT EXISTS post_votes (
  id serial PRIMARY KEY,
  post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS post_votes_post_user_idx ON post_votes(post_id, user_id);

CREATE TABLE IF NOT EXISTS comment_votes (
  id serial PRIMARY KEY,
  comment_id integer NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS comment_votes_comment_user_idx ON comment_votes(comment_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS event_rsvps_event_user_idx ON event_rsvps(event_id, user_id);
