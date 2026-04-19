-- ============================================================================
-- MIGRACIÓN 001: Crear tabla de usuarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'Basic' CHECK (account_type IN ('Basic', 'Premium')),
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna is_admin si no existe (para tablas existentes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usuario administrador por defecto
-- Contraseña: admin123 (CAMBIAR DESPUÉS DEL PRIMER LOGIN)
-- Hash generado con bcryptjs rounds=10
INSERT INTO users (username, email, password_hash, account_type, is_admin, is_active) 
VALUES ('admin', 'admin@d4builds.com', '$2a$10$MAL/h8wD3y4Pl.G6w/7yA.wn4qLNsHTYoDeTD4APmxiuG30KhcuVe', 'Premium', true, true)
ON CONFLICT (username) DO UPDATE SET is_admin = true, account_type = 'Premium';

COMMENT ON TABLE users IS 'Tabla de usuarios con autenticación y niveles de cuenta';
