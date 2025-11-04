
CREATE TABLE streamers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rank TEXT,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  twitch_username TEXT,
  youtube_username TEXT,
  twitter_username TEXT,
  instagram_username TEXT,
  is_live BOOLEAN DEFAULT 0,
  stream_platform TEXT,
  stream_url TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
