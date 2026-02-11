# Integração Biométrica ZKTeco em Tempo Real

Este guia explica como colocar o seu biométrico a comunicar directamente com o sistema de RH.

## Requisitos
1. Um computador na mesma rede (Wi-Fi ou Cabo) que o biométrico.
2. [Node.js](https://nodejs.org/) instalado nesse computador.
3. O endereço IP da máquina biométrica (ex: `192.168.1.100`).

## Instruções de Instalação

1. Abra o terminal (ou CMD) na pasta `biometric-integration`.
2. Instale as bibliotecas necessárias com o comando:
   ```bash
   npm install node-zklib @supabase/supabase-js
   ```
3. Abra o ficheiro `biometric-bridge.js` e altere o `DEVICE_IP` para o IP correcto do seu aparelho.
4. Inicie a sincronização:
   ```bash
   node biometric-bridge.js
   ```

## Configuração da Base de Dados
Deve executar o seguinte comando SQL no editor do Supabase (SQL Editor) para que o sistema saiba processar as picagens:

```sql
-- Função para processar picagens do biométrico
CREATE OR REPLACE FUNCTION log_biometric_attendance(
    p_employee_id UUID,
    p_date DATE,
    p_timestamp TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
    v_existing_id UUID;
BEGIN
    SELECT id INTO v_existing_id 
    FROM attendance_records 
    WHERE employee_id = p_employee_id AND date = p_date;

    IF v_existing_id IS NULL THEN
        -- Primeira picagem do dia: Check-in
        INSERT INTO attendance_records (employee_id, date, check_in, status)
        VALUES (p_employee_id, p_date, p_timestamp, 'PRESENT');
    ELSE
        -- Picagens subsequentes no mesmo dia actualizam o Check-out
        UPDATE attendance_records 
        SET check_out = p_timestamp
        WHERE id = v_existing_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Como funciona o mapeamento?

Para o sistema saber de quem é a "dedada", o **ID** que está configurado no Biométrico deve ser igual ao **Número de Funcionário** que registou no sistema.

**Exemplo:**
- No Sistema RH: Funcionário João tem o Nº `105`.
- No Biométrico: O João deve estar registado com o ID `105`.

## Notas de Segurança
O script fornecido usa uma chave de acesso ao sistema. Mantenha este script apenas no computador da empresa que fará a ponte.
