
-- Eliminar índices de aplicaciones
DROP INDEX IF EXISTS idx_applications_created_at;
DROP INDEX IF EXISTS idx_applications_name; 
DROP INDEX IF EXISTS idx_applications_status;

-- Eliminar tabla de aplicaciones
DROP TABLE IF EXISTS streamer_applications;
