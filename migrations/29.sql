
-- TABLA DE LOGS SIMPLE Y ROBUSTA
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT CHECK(level IN ('info', 'warn', 'error', 'success')),
  operation TEXT,
  message TEXT,
  details TEXT,
  duration_ms INTEGER DEFAULT 0
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_operation ON logs(operation);
