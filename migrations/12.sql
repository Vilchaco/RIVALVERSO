
CREATE TABLE IF NOT EXISTS streamer_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ingame_username TEXT NOT NULL,
  twitch_username TEXT,
  youtube_username TEXT,
  twitter_username TEXT,
  instagram_username TEXT,
  tiktok_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  marvel_rivals_data TEXT,
  application_notes TEXT,
  rejection_reason TEXT,
  approved_at DATETIME,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_streamer_applications_status ON streamer_applications(status);
CREATE INDEX IF NOT EXISTS idx_streamer_applications_created_at ON streamer_applications(created_at);
