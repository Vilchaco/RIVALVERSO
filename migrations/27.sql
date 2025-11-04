
-- Create player_cache table for storing Marvel Rivals UUIDs to avoid repeated findPlayer calls
CREATE TABLE player_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingame_username TEXT NOT NULL UNIQUE,
  marvel_rivals_uuid TEXT NOT NULL,
  last_verified_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_cache_username ON player_cache(ingame_username);
CREATE INDEX idx_player_cache_uuid ON player_cache(marvel_rivals_uuid);
CREATE INDEX idx_player_cache_verified_at ON player_cache(last_verified_at);
