-- ============================================================================
-- MIGRACIÓN 002: Crear tabla de uso de billing (OpenAI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('openai', 'gemini')),
  model VARCHAR(50) NOT NULL,
  functionality VARCHAR(100) NOT NULL,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  cost_input DECIMAL(10, 6) NOT NULL DEFAULT 0,
  cost_output DECIMAL(10, 6) NOT NULL DEFAULT 0,
  cost_total DECIMAL(10, 6) NOT NULL DEFAULT 0,
  category VARCHAR(50),
  operation VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas y reportes
CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_provider ON billing_usage(provider);
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON billing_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_user_date ON billing_usage(user_id, created_at);

-- Vista para resumir uso por usuario
CREATE OR REPLACE VIEW user_billing_summary AS
SELECT 
  u.id AS user_id,
  u.username,
  u.account_type,
  COUNT(b.id) AS total_requests,
  SUM(b.tokens_total) AS total_tokens,
  SUM(b.cost_total) AS total_cost,
  MAX(b.created_at) AS last_usage
FROM users u
LEFT JOIN billing_usage b ON u.id = b.user_id
GROUP BY u.id, u.username, u.account_type;

COMMENT ON TABLE billing_usage IS 'Registro de uso de APIs de IA por usuario';
COMMENT ON VIEW user_billing_summary IS 'Resumen de costos y uso por usuario';
