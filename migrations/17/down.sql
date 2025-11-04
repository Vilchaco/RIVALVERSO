
-- Remove the index and column
DROP INDEX idx_streamers_last_api_update;
ALTER TABLE streamers DROP COLUMN last_api_update_at;
