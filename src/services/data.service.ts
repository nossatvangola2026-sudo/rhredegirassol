import { Injectable, signal, inject } from '@angular/core';
import { Employee, AttendanceRecord, Justification, Department, SystemConfig } from './data.types';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private supabase = inject(SupabaseService);

  // Signals for reactivity
  employees = signal<Employee[]>([]);
  attendance = signal<AttendanceRecord[]>([]);
  justifications = signal<Justification[]>([]);
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
    this.loadData();
  }

  private async loadData() {
    await Promise.all([
      this.loadDepartments(),
      this.loadEmployees(),
      this.loadAttendance(),
      this.loadJustifications(),
      this.loadSystemConfig(),
      this.syncServerTime()
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
    const { data, error } = await this.supabase.client
      .from('employees')
      .select('*')
      .order('full_name');

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
    const { data, error } = await this.supabase.client
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });

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
    const { data, error } = await this.supabase.client
      .from('justifications')
      .select('*')
      .order('submission_date', { ascending: false });

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
        licenseExpirationDate: data.license_expiration_date
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
          license_expiration_date: config.licenseExpirationDate
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        alert('Erro ao salvar as configurações no servidor: ' + error.message);
      }
    } else {
      // If config doesn't exist, logic skipped
    }
    this.systemConfig.set(config);
  }


  // Factory Reset (Full) - clears local signals and reloads
  async resetAllData() {
    // Delete all data from tables
    await this.supabase.client.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.client.from('justifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.client.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.client.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    location.reload();
  }

  // Partial Reset (Attendance Only)
  async resetAttendanceOnly() {
    await this.supabase.client.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.client.from('justifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    this.attendance.set([]);
    this.justifications.set([]);
  }

  private async checkAutoAttendance() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastRunKey = 'girassol_auto_run_date';

    // Check local storage to avoid running multiple times per session/refresh unnecessarily
    // But since we want to ensure DB has records, we relying on runAutoPresence duplicate check is safer?
    // runAutoPresence already checks `if (!exists)` against loaded attendance.

    // However, to avoid spamming checking every refresh:
    const lastRun = localStorage.getItem(lastRunKey);

    if (lastRun !== todayStr) {
      console.log('Running auto-attendance check for:', todayStr);
      await this.runAutoPresence(todayStr);
      localStorage.setItem(lastRunKey, todayStr);
    }
  }

  private async runAutoPresence(dateStr: string) {
    const employees = this.employees();
    const currentAttendance = this.attendance();
    const newRecords: any[] = [];

    employees.forEach(emp => {
      if (emp.status !== 'ACTIVE') return;
      const exists = currentAttendance.find(a => a.employeeId === emp.id && a.date === dateStr);

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
    });

    if (newRecords.length > 0) {
      const { data } = await this.supabase.client
        .from('attendance_records')
        .insert(newRecords)
        .select();

      if (data) {
        const mapped = data.map(a => ({
          id: a.id,
          employeeId: a.employee_id,
          date: a.date,
          checkIn: a.check_in,
          checkOut: a.check_out,
          status: a.status,
          isJustified: a.is_justified,
          overtimeHours: a.overtime_hours
        }));
        this.attendance.update(prev => [...prev, ...mapped]);
        console.log(`Auto-attendance: Marked ${newRecords.length} employees as PRESENT.`);
      }
    }
  }

  // Employee Methods
  async addEmployee(emp: Employee) {
    console.log('Attempting to add employee:', emp);
    const { data, error } = await this.supabase.client
      .from('employees')
      .insert({
        full_name: emp.fullName,
        employee_number: emp.employeeNumber,
        job_title: emp.jobTitle,
        department: emp.department,
        contract_type: emp.contractType,
        admission_date: emp.admissionDate,
        supervisor_id: emp.supervisorId || null,
        status: emp.status,
        email: emp.email,
        schedule_start: emp.scheduleStart,
        schedule_end: emp.scheduleEnd
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding employee:', error);
      return false;
    }

    if (data) {
      const newEmp: Employee = {
        id: data.id,
        fullName: data.full_name,
        employeeNumber: data.employee_number,
        jobTitle: data.job_title,
        department: data.department,
        contractType: data.contract_type,
        admissionDate: data.admission_date,
        supervisorId: data.supervisor_id,
        status: data.status,
        email: data.email,
        scheduleStart: data.schedule_start,
        scheduleEnd: data.schedule_end
      };
      this.employees.update(list => [...list, newEmp]);
      return true;
    }
    return false;
  }

  async updateEmployee(emp: Employee) {
    console.log('Attempting to update employee:', emp);
    const { error } = await this.supabase.client
      .from('employees')
      .update({
        full_name: emp.fullName,
        employee_number: emp.employeeNumber,
        job_title: emp.jobTitle,
        department: emp.department,
        contract_type: emp.contractType,
        admission_date: emp.admissionDate,
        supervisor_id: emp.supervisorId || null,
        status: emp.status,
        email: emp.email,
        schedule_start: emp.scheduleStart,
        schedule_end: emp.scheduleEnd
      })
      .eq('id', emp.id);

    if (error) {
      console.error('Error updating employee:', error);
      return false;
    }

    this.employees.update(list => list.map(e => e.id === emp.id ? emp : e));
    return true;
  }

  async deleteEmployee(id: string) {
    const { error } = await this.supabase.client
      .from('employees')
      .delete()
      .eq('id', id);

    if (!error) {
      this.employees.update(list => list.filter(e => e.id !== id));
    }
  }

  getEmployeeById(id: string) {
    return this.employees().find(e => e.id === id);
  }

  // Department Methods
  async addDepartment(dept: Department) {
    const { data, error } = await this.supabase.client
      .from('departments')
      .insert({
        name: dept.name,
        description: dept.description
      })
      .select()
      .single();

    if (data && !error) {
      const newDept: Department = {
        id: data.id,
        name: data.name,
        description: data.description
      };
      this.departments.update(list => [...list, newDept]);
    }
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
      this.departments.update(list => list.map(d => d.id === dept.id ? dept : d));
    }
  }

  async deleteDepartment(id: string) {
    const { error } = await this.supabase.client
      .from('departments')
      .delete()
      .eq('id', id);

    if (!error) {
      this.departments.update(list => list.filter(d => d.id !== id));
    }
  }

  // Attendance Methods
  async logAttendance(record: AttendanceRecord) {
    const existing = this.attendance().find(r => r.id === record.id);

    if (existing) {
      const { error } = await this.supabase.client
        .from('attendance_records')
        .update({
          check_in: record.checkIn,
          check_out: record.checkOut,
          status: record.status,
          is_justified: record.isJustified,
          overtime_hours: record.overtimeHours
        })
        .eq('id', record.id);

      if (!error) {
        this.attendance.update(list => list.map(r => r.id === record.id ? record : r));
      }
    } else {
      const { data, error } = await this.supabase.client
        .from('attendance_records')
        .insert({
          employee_id: record.employeeId,
          date: record.date,
          check_in: record.checkIn,
          check_out: record.checkOut,
          status: record.status,
          is_justified: record.isJustified,
          overtime_hours: record.overtimeHours
        })
        .select()
        .single();

      if (data && !error) {
        const newRecord: AttendanceRecord = {
          id: data.id,
          employeeId: data.employee_id,
          date: data.date,
          checkIn: data.check_in,
          checkOut: data.check_out,
          status: data.status,
          isJustified: data.is_justified,
          overtimeHours: data.overtime_hours
        };
        this.attendance.update(list => [...list, newRecord]);
      }
    }
  }

  getAttendanceForEmployee(empId: string) {
    return this.attendance().filter(r => r.employeeId === empId);
  }

  // Justification Methods
  async addJustification(just: Justification) {
    const { data, error } = await this.supabase.client
      .from('justifications')
      .insert({
        employee_id: just.employeeId,
        attendance_date: just.attendanceDate,
        reason: just.reason,
        attachment_url: just.attachmentUrl,
        status: just.status,
        admin_comment: just.adminComment,
        submission_date: just.submissionDate
      })
      .select()
      .single();

    if (data && !error) {
      const newJust: Justification = {
        id: data.id,
        employeeId: data.employee_id,
        attendanceDate: data.attendance_date,
        reason: data.reason,
        attachmentUrl: data.attachment_url,
        status: data.status,
        adminComment: data.admin_comment,
        submissionDate: data.submission_date
      };
      this.justifications.update(list => [...list, newJust]);
    }
  }

  async updateJustification(just: Justification) {
    const { error } = await this.supabase.client
      .from('justifications')
      .update({
        reason: just.reason,
        attachment_url: just.attachmentUrl,
        status: just.status,
        admin_comment: just.adminComment
      })
      .eq('id', just.id);

    if (!error) {
      this.justifications.update(list => list.map(j => j.id === just.id ? just : j));
    }
  }

  // Bulk Import Logic
  async bulkUpsert(newEmployees: Employee[], newDepartments: string[]) {
    console.log('bulkUpsert chamado com:', newEmployees.length, 'funcionários e', newDepartments.length, 'departamentos');

    // Force refresh data to ensure we have latest from DB
    await this.loadDepartments();
    await this.loadEmployees();

    // 1. Process Departments
    const existingDepts = this.departments();
    const existingDeptNames = existingDepts.map(d => d.name.toLowerCase());

    let deptsAdded = 0;
    const deptsToAdd: { name: string; description: string }[] = [];

    newDepartments.forEach(deptName => {
      if (!deptName) return;
      // Also add to list if not strictly in local names, but upsert will handle DB conflicts
      if (!existingDeptNames.includes(deptName.toLowerCase())) {
        deptsToAdd.push({
          name: deptName,
          description: 'Importado automaticamente via Excel'
        });
        existingDeptNames.push(deptName.toLowerCase());
        deptsAdded++;
      }
    });

    if (deptsToAdd.length > 0) {
      console.log('A inserir/atualizar departamentos:', deptsToAdd);
      // Use UPSERT to handle race conditions or existing items gracefully
      const { data, error } = await this.supabase.client
        .from('departments')
        .upsert(deptsToAdd, { onConflict: 'name', ignoreDuplicates: true })
        .select();

      if (error) {
        console.error('Erro ao inserir departamentos:', error);
      } else if (data) {
        // Refresh departments again to get IDs generated by DB if needed, or just map result
        console.log('Departamentos processados:', data.length);
        // We reload to be sure we have clean state with IDs
        await this.loadDepartments();
      }
    }

    // 2. Process Employees
    const currentEmps = this.employees();

    // Create sets of known IDs and Emails to avoid duplicates within the batch and against DB
    const knownEmployeeNumbers = new Set(currentEmps.map(e => e.employeeNumber));
    const knownEmails = new Set(currentEmps.map(e => e.email));

    let empsAdded = 0;
    let empsSkipped = 0;
    const empsToInsert: any[] = [];

    newEmployees.forEach(newEmp => {
      // Check against DB (via known sets) AND duplicates within this batch
      const empNumExists = newEmp.employeeNumber && knownEmployeeNumbers.has(newEmp.employeeNumber);
      const emailExists = newEmp.email && knownEmails.has(newEmp.email);

      if (empNumExists || emailExists) {
        empsSkipped++;
      } else {
        empsToInsert.push({
          full_name: newEmp.fullName,
          employee_number: newEmp.employeeNumber,
          job_title: newEmp.jobTitle,
          department: newEmp.department,
          contract_type: newEmp.contractType,
          admission_date: newEmp.admissionDate,
          status: newEmp.status,
          email: newEmp.email,
          schedule_start: newEmp.scheduleStart,
          schedule_end: newEmp.scheduleEnd
        });

        // Add to known sets so subsequent rows in this batch with same ID are skipped
        if (newEmp.employeeNumber) knownEmployeeNumbers.add(newEmp.employeeNumber);
        if (newEmp.email) knownEmails.add(newEmp.email);

        empsAdded++;
      }
    });

    console.log('Funcionários a inserir:', empsToInsert.length, '| Ignorados:', empsSkipped);

    if (empsToInsert.length > 0) {
      console.log('Amostra do primeiro funcionário:', empsToInsert[0]);
      const { data, error } = await this.supabase.client
        .from('employees')
        .insert(empsToInsert)
        .select();

      if (error) {
        console.error('Erro ao inserir funcionários:', error);
        alert('Erro ao salvar funcionários: ' + error.message);
        return { deptsAdded, empsAdded: 0, empsSkipped };
      } else if (data) {
        console.log('Funcionários inseridos com sucesso:', data.length);
        const mapped = data.map(e => ({
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
        }));
        this.employees.update(list => [...list, ...mapped]);
      }
    }

    console.log('bulkUpsert concluído:', { deptsAdded, empsAdded, empsSkipped });
    return { deptsAdded, empsAdded, empsSkipped };
  }
}