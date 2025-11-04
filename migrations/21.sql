
-- Add score_change column to streamer_match_history table for RS changes
ALTER TABLE streamer_match_history ADD COLUMN score_change INTEGER DEFAULT 0;
