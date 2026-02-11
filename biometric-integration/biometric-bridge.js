const ZKLib = require('node-zklib');
const { createClient } = require('@supabase/supabase-js');

/**
 * CONFIGURAÇÃO DO SISTEMA
 */
const DEVICE_IP = '192.168.1.100'; // SUBSTITUA PELO IP DA MÁQUINA BIOMÉTRICA
const SUPABASE_URL = 'https://oaqlztemqmjdbibrvazs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcWx6dGVtcW1qZGJpYnJ2YXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTExMjAsImV4cCI6MjA4NTYyNzEyMH0.gRhYUQN7sU5XEQAjXIPZzOgXt7Bmh8EctcVWTIWxdcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncBiometric() {
    let zkInstance = new ZKLib(DEVICE_IP, 4370, 10000, 4000);

    try {
        console.log(`Conectando ao biométrico em ${DEVICE_IP}...`);
        await zkInstance.createSocket();
        console.log('Conectado com sucesso!');

        // 1. Ler todos os funcionários para mapear ID -> UUID
        const { data: employees } = await supabase.from('employees').select('id, employee_number');
        const empMap = {};
        employees.forEach(e => {
            empMap[e.employee_number] = e.id;
        });

        // 2. Ouvir eventos em tempo real
        console.log('Aguardando picagens em tempo real...');
        zkInstance.getRealTimeLogs(async (event) => {
            console.log('Nova picagem detectada:', event);

            const employeeId = empMap[event.userId];
            if (!employeeId) {
                console.warn(`Aviso: ID de utilizador ${event.userId} não encontrado no sistema RH.`);
                return;
            }

            const date = event.attTime.toISOString().split('T')[0];
            const timestamp = event.attTime.toISOString();

            // Enviar para o Supabase
            // Nota: O sistema vai decidir se é check-in ou check-out baseado na hora
            const { error } = await supabase.rpc('log_biometric_attendance', {
                p_employee_id: employeeId,
                p_date: date,
                p_timestamp: timestamp
            });

            if (error) console.error('Erro ao guardar no Supabase:', error.message);
            else console.log(`Sucesso: Presença registada para ${event.userId}`);
        });

    } catch (e) {
        console.error('Erro de conexão:', e.message);
        setTimeout(syncBiometric, 10000); // Tentar reconectar após 10s
    }
}

syncBiometric();
