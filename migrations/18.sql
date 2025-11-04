
-- Tabla principal de clips de Twitch
CREATE TABLE twitch_clips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clip_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  broadcaster_name TEXT NOT NULL,
  streamer_id INTEGER,
  category TEXT DEFAULT 'general',
  description TEXT,
  thumbnail_url TEXT,
  embed_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  duration REAL DEFAULT 0,
  language TEXT DEFAULT 'es',
  status TEXT DEFAULT 'pending',
  submitted_by TEXT,
  submitted_ip TEXT,
  admin_notes TEXT,
  approved_at DATETIME,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de votos con sistema de limitación
CREATE TABLE clip_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clip_id INTEGER NOT NULL,
  voter_identifier TEXT NOT NULL,
  vote_type TEXT DEFAULT 'upvote',
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(clip_id, voter_identifier, vote_type)
);

-- Tabla de estadísticas de clips (cache)
CREATE TABLE clip_stats (
  clip_id INTEGER PRIMARY KEY,
  total_votes INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_clips_status ON twitch_clips(status);
CREATE INDEX idx_clips_streamer ON twitch_clips(streamer_id);
CREATE INDEX idx_clips_created ON twitch_clips(created_at DESC);
CREATE INDEX idx_votes_clip ON clip_votes(clip_id);
CREATE INDEX idx_votes_voter ON clip_votes(voter_identifier);
CREATE INDEX idx_votes_created ON clip_votes(created_at);
