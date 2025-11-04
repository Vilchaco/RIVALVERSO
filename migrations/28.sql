
-- Create player_update_log table for tracking API update cooldowns (30 min between updates)
CREATE TABLE player_update_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marvel_rivals_uuid TEXT NOT NULL,
  update_type TEXT NOT NULL, -- 'player_update' or 'player_stats'
  last_update_at DATETIME NOT NULL,
  next_allowed_at DATETIME NOT NULL, -- When next update is allowed (last_update_at + cooldown)
  cooldown_seconds INTEGER NOT NULL DEFAULT 1800, -- 30 minutes default
  api_response_status TEXT, -- 'success', 'rate_limited', 'error'
  api_response_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_update_log_uuid ON player_update_log(marvel_rivals_uuid);
CREATE INDEX idx_player_update_log_type ON player_update_log(update_type);
CREATE INDEX idx_player_update_log_next_allowed ON player_update_log(next_allowed_at);
CREATE UNIQUE INDEX idx_player_update_log_uuid_type ON player_update_log(marvel_rivals_uuid, update_type);
