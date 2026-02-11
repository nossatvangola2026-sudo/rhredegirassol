import { Injectable, signal, inject, effect } from '@angular/core';
import { Employee, AttendanceRecord, Justification, BiometricDeviceUser, Department, SystemConfig } from './data.types';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  // Signals for reactivity
  employees = signal<Employee[]>([]);
  attendance = signal<AttendanceRecord[]>([]);
  justifications = signal<Justification[]>([]);
  biometricUsers = signal<BiometricDeviceUser[]>([]); // New signal
  departments = signal<Department[]>([]);
  serverTime = signal<Date>(new Date());
  deferredPrompt = signal<any>(null);

  // Default Configuration
  systemConfig = signal<SystemConfig>({
    appName: 'Rede Girassol RH',
    logoUrl: 'https://redegirassol.com//abuploads/2022/08/site_rede_girassol_branco_footer.png',
    description: 'Sistema de Gestão de Recursos Humanos. Controlo de presenças, funcionários e relatórios.',
    customCss: ''
  });

  constructor() {
    // Re-carregar dados sempre que o utilizador mudar (Login/Logout/Restore)
    effect(() => {
      const user = this.auth.currentUser();
      console.log('Utilizador detectado pelo DataService:', user?.username, '| Role:', user?.role);
      this.loadData();
    });

    this.setupRealtimeSubscriptions();
  }

  /** Re-carrega todos os dados com o utilizador actual (chamar após login/restore). */
  async triggerBiometricScan() {
    await this.supabase.client
      .from('system_config')
      .update({ bridge_command: 'SCAN' })
      .match({ id: '00000000-0000-0000-0000-000000000000' });
  }

  /** Re-carrega todos os dados com o utilizador actual (chamar após login/restore). */
  async reloadData() {
    await this.loadData();
  }

  private async loadData() {
    // 1. Initial independent loads
    await Promise.all([
      this.loadSystemConfig(),
      this.syncServerTime()
    ]);

    // 2. Load departments first as they are needed for filtering
    await this.loadDepartments();

    // 3. Load employees FIRST. They are a dependency for attendance/justifications filtering
    await this.loadEmployees();

    // 4. Load other data that depends on the filtered employees list
    await Promise.all([
      this.loadAttendance(),
      this.loadJustifications(),
      this.loadBiometricUsers() // Sync biometric device users
    ]);

    this.checkAutoAttendance();
  }

  private async loadDepartments() {
    const { data, error } = await this.supabase.client
      .from('departments')
      .select('*')
      .order('name');

    if (data && !error) {
      this.departments.set(data.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description
      })));
    }
  }

  private async loadEmployees() {
    let query = this.supabase.client
      .from('employees')
      .select('*');

    const user = this.auth.currentUser();
    const role = user?.role?.toUpperCase();
    if (user && (role === 'COORDENADOR' || role === 'DIRECTOR')) {
      // Tentar encontrar o departamento por ID ou por nome
      const dept = this.departments().find(d => d.id === user.departmentId) ||
        this.departments().find(d => d.name === user.departmentName);

      // Usar o nome do departamento vindo do objeto 'dept' ou o que está no utilizador (fallback)
      const targetDeptName = dept?.name || user.departmentName;

      if (targetDeptName) {
        console.log(`Filtrando funcionários para ${role}: departamento "${targetDeptName.trim()}"`);
        // Usar ilike para ser case-insensitive e trim para evitar espaços extra
        query = query.ilike('department', targetDeptName.trim());
      } else {
        // Estrito: Se não tem departamento vinculado, não mostrar nada
        console.warn(`${role} sem departamento vinculado:`, user.username, '| departmentId:', user.departmentId, '| departmentName:', user.departmentName);
        console.log('Departamentos disponíveis:', this.departments().map(d => d.name));
        query = query.eq('department', '___NON_EXISTENT_DEPT___');
      }
    }

    const { data, error } = await query.order('full_name');

    if (data && !error) {
      this.employees.set(data.map(e => ({
        id: e.id,
        fullName: e.full_name,
        employeeNumber: e.employee_number,
        jobTitle: e.job_title,
        department: e.department,
        contractType: e.contract_type,
        admissionDate: e.admission_date,
        supervisorId: e.supervisor_id,
        status: e.status,
        email: e.email,
        scheduleStart: e.schedule_start,
        scheduleEnd: e.schedule_end
      })));
    }
  }

  private async loadAttendance() {
    let query = this.supabase.client
      .from('attendance_records')
      .select('*');

    const user = this.auth.currentUser();
    const role = user?.role?.toUpperCase();
    if (user && (role === 'COORDENADOR' || role === 'DIRECTOR')) {
      const empIds = this.employees().map(e => e.id);
      if (empIds.length > 0) {
        query = query.in('employee_id', empIds);
      } else {
        console.warn('Attendance: Nenhum funcionário encontrado para filtrar para o coordenador.');
        this.attendance.set([]);
        return;
      }
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (data && !error) {
      this.attendance.set(data.map(a => ({
        id: a.id,
        employeeId: a.employee_id,
        date: a.date,
        checkIn: a.check_in,
        checkOut: a.check_out,
        status: a.status,
        isJustified: a.is_justified,
        overtimeHours: a.overtime_hours
      })));
    }
  }

  private async loadJustifications() {
    let query = this.supabase.client
      .from('justifications')
      .select('*');

    const user = this.auth.currentUser();
    const role = user?.role?.toUpperCase();
    if (user && (role === 'COORDENADOR' || role === 'DIRECTOR')) {
      const empIds = this.employees().map(e => e.id);
      if (empIds.length > 0) {
        query = query.in('employee_id', empIds);
      } else {
        console.warn('Justifications: Nenhum funcionário encontrado para filtrar para o coordenador.');
        this.justifications.set([]);
        return;
      }
    }

    const { data, error } = await query.order('submission_date', { ascending: false });

    if (data && !error) {
      this.justifications.set(data.map(j => ({
        id: j.id,
        employeeId: j.employee_id,
        attendanceDate: j.attendance_date,
        reason: j.reason,
        attachmentUrl: j.attachment_url,
        status: j.status,
        adminComment: j.admin_comment,
        submissionDate: j.submission_date
      })));
    }
  }

  private setupRealtimeSubscriptions() {
    // Subscrever mudanças nas presenças
    this.supabase.client
      .channel('attendance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        console.log('Realtime: Mudança nas presenças detectada. Recarregando...');
        this.loadAttendance();
      })
      .subscribe();

    // Subscrever mudanças nas justificações
    this.supabase.client
      .channel('justification_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'justifications' }, () => {
        console.log('Realtime: Mudança nas justificações detectada. Recarregando...');
        this.loadJustifications();
      })
      .subscribe();

    // Subscrever mudanças nos utilizadores do biométrico
    this.supabase.client
      .channel('biometric_user_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biometric_device_users' }, () => {
        console.log('Realtime: Mudança nos utilizadores do biométrico detectada.');
        this.loadBiometricUsers();
      })
      .subscribe();

    // Subscrever mudanças na configuração do sistema (Ponte)
    this.supabase.client
      .channel('system_config_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config' }, () => {
        console.log('Realtime: Mudança na configuração do sistema detectada.');
        this.loadSystemConfig();
      })
      .subscribe();
  }

  private async loadBiometricUsers() {
    const { data, error } = await this.supabase.client
      .from('biometric_device_users')
      .select('*')
      .order('device_user_id');

    if (data && !error) {
      this.biometricUsers.set(data.map(u => ({
        id: u.id,
        deviceUserId: u.device_user_id,
        name: u.name,
        cardNumber: u.card_number,
        lastSync: u.last_sync
      })));
    }
  }

  private async loadSystemConfig() {
    const { data, error } = await this.supabase.client
      .from('system_config')
      .select('*')
      .limit(1)
      .single();

    if (data && !error) {
      this.systemConfig.set({
        appName: data.app_name,
        logoUrl: data.logo_url,
        description: data.description,
        customCss: data.custom_css,
        licenseKey: data.license_key,
        licenseExpirationDate: data.license_expiration_date,
        biometricIp: data.biometric_ip,
        bridgeStatus: data.bridge_status,
        bridgeLastSeen: data.bridge_last_seen,
        bridgeLog: data.bridge_log,
        bridgeCommand: data.bridge_command,
        bridgeScanResults: data.bridge_scan_results
      });
    }
  }

  private async syncServerTime() {
    const { data, error } = await this.supabase.client.rpc('get_server_time');
    if (data && !error) {
      this.serverTime.set(new Date(data));
      console.log('Tempo do servidor sincronizado:', this.serverTime());
    }
  }

  async updateConfig(config: SystemConfig) {
    const { data: existing } = await this.supabase.client
      .from('system_config')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      const { error } = await this.supabase.client
        .from('system_config')
        .update({
          app_name: config.appName,
          logo_url: config.logoUrl,
          description: config.description,
          custom_css: config.customCss,
          license_key: config.licenseKey,
          license_expiration_date: config.licenseExpirationDate,
          biometric_ip: config.biometricIp
        })
        .eq('id', existing.id);

      if (!error) {
        this.systemConfig.set(config);
      }
    }
  }

  async resetAllData() {
    if (!confirm('DANGER: This will delete ALL employees, attendance and justifications. Continue?')) return;

    await this.supabase.client.from('justifications').delete().neq('id', '0');
    await this.supabase.client.from('attendance_records').delete().neq('id', '0');
    await this.supabase.client.from('employees').delete().neq('id', '0');

    await this.loadData();
  }

  async resetAttendanceOnly() {
    if (!confirm('Deseja apagar TODO o histórico de presenças e justificações?')) return;
    await this.supabase.client.from('justifications').delete().neq('id', '0');
    await this.supabase.client.from('attendance_records').delete().neq('id', '0');
    await this.loadData();
  }

  async hardResetUsers() {
    if (!confirm('CUIDADO: Isto apagará TODOS os utilizadores excepto o Administrador. Esta ação é irreversível. Continuar?')) return;
    // We assume 'admin' is the username of the administrator
    const { error } = await this.supabase.client
      .from('users')
      .delete()
      .neq('username', 'admin');

    if (!error) {
      alert('Utilizadores apagados com sucesso (excepto admin).');
    } else {
      console.error('Erro ao apagar utilizadores:', error);
      alert('Erro ao apagar utilizadores. Verifique a consola.');
    }
  }

  async checkAutoAttendance() {
    const config = this.systemConfig();
    // Logic for auto attendance could go here if needed
  }

  async runAutoPresence(dateStr: string) {
    const employees = this.employees().filter(e => e.status === 'ACTIVE');
    const attendance = this.attendance().filter(a => a.date === dateStr);

    const newRecords: any[] = [];

    for (const emp of employees) {
      const exists = attendance.some(a => a.employeeId === emp.id);
      if (!exists) {
        const startTime = (emp.scheduleStart || '08:00').substring(0, 5);
        const endTime = (emp.scheduleEnd || '17:00').substring(0, 5);

        newRecords.push({
          employee_id: emp.id,
          date: dateStr,
          check_in: `${dateStr}T${startTime}:00`,
          check_out: `${dateStr}T${endTime}:00`,
          status: 'PRESENT',
          is_justified: false,
          overtime_hours: 0
        });
      }
    }

    if (newRecords.length > 0) {
      await this.supabase.client.from('attendance_records').insert(newRecords);
      await this.loadAttendance();
    }
  }

  async addEmployee(emp: Employee) {
    const { data, error } = await this.supabase.client
      .from('employees')
      .insert([{
        full_name: emp.fullName,
        employee_number: emp.employeeNumber,
        job_title: emp.jobTitle,
        department: emp.department,
        contract_type: emp.contractType,
        admission_date: emp.admissionDate,
        supervisor_id: emp.supervisorId,
        status: emp.status,
        email: emp.email,
        schedule_start: emp.scheduleStart,
        schedule_end: emp.scheduleEnd
      }])
      .select()
      .single();

    if (!error) {
      await this.loadEmployees();
    }
    return !error;
  }

  async updateEmployee(emp: Employee) {
    const { error } = await this.supabase.client
      .from('employees')
      .update({
        full_name: emp.fullName,
        employee_number: emp.employeeNumber,
        job_title: emp.jobTitle,
        department: emp.department,
        contract_type: emp.contractType,
        admission_date: emp.admissionDate,
        supervisor_id: emp.supervisorId,
        status: emp.status,
        email: emp.email,
        schedule_start: emp.scheduleStart,
        schedule_end: emp.scheduleEnd
      })
      .eq('id', emp.id);

    if (!error) {
      await this.loadEmployees();
    }
    return !error;
  }

  async deleteEmployee(id: string) {
    const { error } = await this.supabase.client
      .from('employees')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadEmployees();
      await this.loadAttendance();
      await this.loadJustifications();
    }
    return !error;
  }

  getEmployeeById(id: string) {
    return this.employees().find(e => e.id === id);
  }

  async addDepartment(dept: Department) {
    const { error } = await this.supabase.client
      .from('departments')
      .insert([{
        name: dept.name,
        description: dept.description
      }]);

    if (!error) {
      await this.loadDepartments();
    }
    return !error;
  }

  async updateDepartment(dept: Department) {
    const { error } = await this.supabase.client
      .from('departments')
      .update({
        name: dept.name,
        description: dept.description
      })
      .eq('id', dept.id);

    if (!error) {
      await this.loadDepartments();
    }
    return !error;
  }

  async deleteDepartment(id: string) {
    const { error } = await this.supabase.client
      .from('departments')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadDepartments();
    }
    return !error;
  }

  async logAttendance(record: AttendanceRecord) {
    // Upsert logic
    const { data: existing } = await this.supabase.client
      .from('attendance_records')
      .select('id')
      .eq('employee_id', record.employeeId)
      .eq('date', record.date)
      .maybeSingle();

    const payload = {
      employee_id: record.employeeId,
      date: record.date,
      check_in: record.checkIn,
      check_out: record.checkOut,
      status: record.status,
      is_justified: record.isJustified,
      overtime_hours: record.overtimeHours
    };

    let error;
    if (existing) {
      const res = await this.supabase.client
        .from('attendance_records')
        .update(payload)
        .eq('id', existing.id);
      error = res.error;
    } else {
      const res = await this.supabase.client
        .from('attendance_records')
        .insert([payload]);
      error = res.error;
    }

    if (!error) {
      await this.loadAttendance();
    }
    return !error;
  }

  async deleteAttendance(empId: string, date: string) {
    const { error } = await this.supabase.client
      .from('attendance_records')
      .delete()
      .eq('employee_id', empId)
      .eq('date', date);

    if (!error) {
      await this.loadAttendance();
    }
    return !error;
  }

  getAttendanceForEmployee(empId: string) {
    return this.attendance().filter(a => a.employeeId === empId);
  }

  async addJustification(just: Justification) {
    const { error } = await this.supabase.client
      .from('justifications')
      .insert([{
        employee_id: just.employeeId,
        attendance_date: just.attendanceDate,
        reason: just.reason,
        attachment_url: just.attachmentUrl,
        status: just.status,
        submission_date: just.submissionDate,
        admin_comment: just.adminComment
      }]);

    if (!error) {
      await this.loadJustifications();
    }
    return !error;
  }

  async updateJustification(just: Justification) {
    const { error } = await this.supabase.client
      .from('justifications')
      .update({
        status: just.status,
        admin_comment: just.adminComment
      })
      .eq('id', just.id);

    if (!error) {
      await this.loadJustifications();
    }
    return !error;
  }

  async deleteJustificationsForEmployeeOnDate(empId: string, date: string) {
    const { error } = await this.supabase.client
      .from('justifications')
      .delete()
      .eq('employee_id', empId)
      .eq('attendance_date', date);

    if (!error) {
      await this.loadJustifications();
    }
    return !error;
  }

  async bulkUpsert(newEmployees: Employee[], newDepartments: string[]): Promise<{ empsAdded: number; empsSkipped: number }> {
    let empsAdded = 0;
    let empsSkipped = 0;

    // 1. Upsert departments
    for (const deptName of newDepartments) {
      const exists = this.departments().some(d => d.name === deptName);
      if (!exists) {
        await this.supabase.client
          .from('departments')
          .insert([{ name: deptName, description: '' }]);
      }
    }
    await this.loadDepartments();

    // 2. Upsert employees (skip if employeeNumber already exists)
    const existingNumbers = new Set(this.employees().map(e => e.employeeNumber));

    const toInsert: any[] = [];
    for (const emp of newEmployees) {
      if (existingNumbers.has(emp.employeeNumber)) {
        empsSkipped++;
        continue;
      }
      toInsert.push({
        full_name: emp.fullName,
        employee_number: emp.employeeNumber,
        job_title: emp.jobTitle,
        department: emp.department,
        contract_type: emp.contractType,
        admission_date: emp.admissionDate,
        status: emp.status,
        email: emp.email,
        schedule_start: emp.scheduleStart,
        schedule_end: emp.scheduleEnd
      });
    }

    if (toInsert.length > 0) {
      const { error } = await this.supabase.client
        .from('employees')
        .insert(toInsert);

      if (!error) {
        empsAdded = toInsert.length;
      } else {
        console.error('Erro ao inserir funcionários em bulk:', error);
      }
    }

    await this.loadEmployees();
    return { empsAdded, empsSkipped };
  }
}