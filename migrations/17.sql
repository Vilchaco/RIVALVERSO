
-- Add column to track when each streamer's API was last updated
ALTER TABLE streamers ADD COLUMN last_api_update_at DATETIME;

-- Create index for efficient querying
CREATE INDEX idx_streamers_last_api_update ON streamers(last_api_update_at);
