-- Add soft delete to tickets_soporte
ALTER TABLE tickets_soporte ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
