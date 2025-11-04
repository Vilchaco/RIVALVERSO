
CREATE TABLE streamer_role_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER NOT NULL,
  role_name TEXT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  kd_ratio REAL DEFAULT 0,
  kda_ratio REAL DEFAULT 0,
  time_played INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,
  total_healing INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(streamer_id, role_name)
);
