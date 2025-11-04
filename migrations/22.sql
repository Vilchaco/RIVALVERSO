
-- Agregar columnas para información de mapas en el historial de partidas
ALTER TABLE streamer_match_history ADD COLUMN map_name TEXT;
ALTER TABLE streamer_match_history ADD COLUMN map_image_url TEXT;
