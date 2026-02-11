const ZKLib = require('node-zklib');
const { createClient } = require('@supabase/supabase-js');
const os = require('os');
const net = require('net');

/**
 * CONFIGURAÇÃO DO SISTEMA
 */
const DEVICE_IP = '192.168.1.100'; // SUBSTITUA PELO IP DA MÁQUINA BIOMÉTRICA
const SUPABASE_URL = 'https://oaqlztemqmjdbibrvazs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcWx6dGVtcW1qZGJpYnJ2YXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTExMjAsImV4cCI6MjA4NTYyNzEyMH0.gRhYUQN7sU5XEQAjXIPZzOgXt7Bmh8EctcVWTIWxdcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function logToSystem(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌ ERROR' : 'ℹ️ INFO';
    const log = `[${timestamp}] ${prefix}: ${message}`;
    console.log(log);

    // Enviar log para o Supabase (opcional, para ver no Dashboard)
    supabase.from('system_config').update({ bridge_log: log }).match({ id: '00000000-0000-0000-0000-000000000000' }).then();
}

async function syncBiometric() {
    // 0. Heartbeat Loop (Avisar o sistema que a ponte está viva)
    setInterval(async () => {
        await supabase.from('system_config')
            .update({
                bridge_status: 'ONLINE',
                bridge_last_seen: new Date().toISOString()
            })
            .match({ id: '00000000-0000-0000-0000-000000000000' });
    }, 30000);

    // 0.1 Procurar IP configurado no sistema
    logToSystem('Procurando configuração de IP no Supabase...');
    const { data: config } = await supabase.from('system_config').select('biometric_ip').single();
    const activeIp = config?.biometric_ip || DEVICE_IP;

    let zkInstance = new ZKLib(activeIp, 4370, 10000, 4000);

    try {
        logToSystem(`Conectando ao biométrico em ${activeIp}...`);
        await zkInstance.createSocket();
        logToSystem('Conectado com sucesso!');

        // 1. Ler todos os funcionários para mapear ID -> UUID
        const { data: employees } = await supabase.from('employees').select('id, employee_number');
        const empMap = {};
        employees.forEach(e => {
            empMap[e.employee_number] = e.id;
        });

        // 2. Sincronizar lista de utilizadores da máquina para o Monitor de Programador
        logToSystem('Sincronizando lista de utilizadores do aparelho...');
        const users = await zkInstance.getUsers();
        const { error: syncError } = await supabase.rpc('sync_biometric_users', {
            p_users: users.data
        });
        if (syncError) logToSystem('Erro ao sincronizar monitor: ' + syncError.message, true);
        else logToSystem(`${users.data.length} utilizadores sincronizados para o monitor.`);

        // 3. Ouvir eventos em tempo real
        logToSystem('Aguardando picagens em tempo real...');
        zkInstance.getRealTimeLogs(async (event) => {
            logToSystem(`Nova picagem detectada: User ${event.userId}`);

            const employeeId = empMap[event.userId];
            if (!employeeId) {
                logToSystem(`Aviso: ID ${event.userId} não encontrado no sistema RH.`, true);
                return;
            }

            const date = event.attTime.toISOString().split('T')[0];
            const timestamp = event.attTime.toISOString();

            const { error } = await supabase.rpc('log_biometric_attendance', {
                p_employee_id: employeeId,
                p_date: date,
                p_timestamp: timestamp
            });

            if (error) logToSystem('Erro ao guardar no Supabase: ' + error.message, true);
            else logToSystem(`Sucesso: Presença registada para ${event.userId}`);
        });

    } catch (e) {
        logToSystem('Erro de conexão: ' + e.message, true);
        await supabase.from('system_config')
            .update({ bridge_status: 'ERROR', bridge_log: 'ERRO DE CONEXÃO: ' + e.message })
            .match({ id: '00000000-0000-0000-0000-000000000000' });

        setTimeout(syncBiometric, 15000); // Tentar reconectar após 15s
    }
}

// LÓGICA DE PROCURA NA REDE (SCAN)
async function listenForCommands() {
    setInterval(async () => {
        const { data: config } = await supabase.from('system_config').select('bridge_command').single();

        if (config?.bridge_command === 'SCAN') {
            logToSystem('Comando [SCAN] recebido. Iniciando procura na rede...');

            // 1. Limpar comando para não repetir
            await supabase.from('system_config')
                .update({ bridge_command: null, bridge_scan_results: [] })
                .match({ id: '00000000-0000-0000-0000-000000000000' });

            const results = await performNetworkScan();
            logToSystem(`Procura concluída. ${results.length} dispositivos encontrados.`);

            // 2. Salvar resultados
            await supabase.from('system_config')
                .update({ bridge_scan_results: results })
                .match({ id: '00000000-0000-0000-0000-000000000000' });
        }
    }, 5000);
}

async function performNetworkScan() {
    const interfaces = os.networkInterfaces();
    let subnet = '192.168.1'; // Default fallback

    // Tentar descobrir a sub-rede local actual
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const parts = iface.address.split('.');
                subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
                break;
            }
        }
    }

    const found = [];
    const scanBatch = [];

    logToSystem(`A varrer sub-rede: ${subnet}.x na porta 4370...`);

    for (let i = 1; i <= 254; i++) {
        const ip = `${subnet}.${i}`;
        scanBatch.push(checkPort(ip, 4370, 1000).then(isOpen => {
            if (isOpen) found.push({ ip, port: 4370 });
        }));

        // Limitar concorrência para não travar a rede
        if (scanBatch.length >= 50) {
            await Promise.all(scanBatch);
            scanBatch.length = 0;
        }
    }
    await Promise.all(scanBatch);
    return found;
}

function checkPort(ip, port, timeout) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, ip);
    });
}

syncBiometric();
listenForCommands();
