-- Tabela de cache para utilizadores do dispositivo biométrico
CREATE TABLE IF NOT EXISTS biometric_device_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_user_id TEXT UNIQUE NOT NULL, -- ID na máquina (ex: 105)
    name TEXT,                           -- Nome na máquina
    card_number TEXT,                    -- Número do cartão/UID
    last_sync TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Realtime para esta tabela
ALTER PUBLICATION supabase_realtime ADD TABLE biometric_device_users;

-- RPC para sincronização em massa (limpa e insere)
CREATE OR REPLACE FUNCTION sync_biometric_users(p_users JSONB) 
RETURNS VOID AS $$
BEGIN
    -- Limpar cache antigo (opcional, ou podemos fazer upsert)
    DELETE FROM biometric_device_users;
    
    -- Inserir novos dados
    INSERT INTO biometric_device_users (device_user_id, name, card_number)
    SELECT 
        (value->>'uid')::TEXT,
        (value->>'name')::TEXT,
        (value->>'cardno')::TEXT
    FROM jsonb_array_elements(p_users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
