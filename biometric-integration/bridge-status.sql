-- Adicionar campos de monitorização da ponte ao sistema
ALTER TABLE system_config 
ADD COLUMN IF NOT EXISTS bridge_status TEXT DEFAULT 'OFFLINE',
ADD COLUMN IF NOT EXISTS bridge_last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bridge_log TEXT,
ADD COLUMN IF NOT EXISTS bridge_command TEXT,
ADD COLUMN IF NOT EXISTS bridge_scan_results JSONB DEFAULT '[]';

-- Garantir que o Realtime escuta estas mudanças para o Dashboard actualizar sozinho
ALTER PUBLICATION supabase_realtime ADD TABLE system_config;
