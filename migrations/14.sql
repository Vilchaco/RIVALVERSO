
-- Create streamer_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS streamer_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ingame_username TEXT NOT NULL,
  twitch_username TEXT,
  youtube_username TEXT,
  twitter_username TEXT,
  instagram_username TEXT,
  tiktok_username TEXT,
  status TEXT DEFAULT 'pending',
  marvel_rivals_data TEXT,
  application_notes TEXT,
  rejection_reason TEXT,
  approved_at DATETIME,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON streamer_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_name ON streamer_applications(name);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON streamer_applications(created_at);
