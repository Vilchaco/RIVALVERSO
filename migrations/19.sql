
CREATE TABLE streamer_match_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER NOT NULL,
  match_id TEXT NOT NULL,
  result TEXT NOT NULL,
  hero_played TEXT NOT NULL,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  match_timestamp DATETIME NOT NULL,
  duration INTEGER,
  game_mode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(streamer_id, match_id)
);

CREATE INDEX idx_streamer_match_history_streamer ON streamer_match_history(streamer_id);
CREATE INDEX idx_streamer_match_history_timestamp ON streamer_match_history(match_timestamp DESC);
