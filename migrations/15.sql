
-- Crear tabla de aplicaciones de streamers si no existe
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

-- Crear índices para la tabla de aplicaciones
CREATE INDEX IF NOT EXISTS idx_applications_status ON streamer_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_name ON streamer_applications(name);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON streamer_applications(created_at);

-- Asegurar que las tablas principales existan (por si acaso)
CREATE TABLE IF NOT EXISTS streamers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  rank TEXT,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  kd_ratio REAL DEFAULT 0,
  kda_ratio REAL DEFAULT 0,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  time_played INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,
  total_healing INTEGER DEFAULT 0,
  twitch_username TEXT,
  youtube_username TEXT,
  twitter_username TEXT,
  instagram_username TEXT,
  tiktok_username TEXT,
  ingame_username TEXT,
  is_live BOOLEAN DEFAULT 0,
  stream_platform TEXT,
  stream_url TEXT,
  avatar_url TEXT,
  marvel_rivals_uid TEXT,
  profile_url TEXT,
  previous_position INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streamer_hero_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER NOT NULL,
  hero_name TEXT NOT NULL,
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streamer_role_stats (
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
