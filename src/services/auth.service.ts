import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, Role } from './data.types';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router: Router = inject(Router);

  currentUser = signal<User | null>(null);

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    const session = localStorage.getItem('girassol_session');
    if (session) {
      this.currentUser.set(JSON.parse(session));
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    const passwordHash = btoa(password);

    const { data, error } = await this.supabase.client
      .from('users')
      .select('*, departments(name)')
      .eq('username', username)
      .eq('password_hash', passwordHash)
      .single();

    if (data && !error) {
      const user: User = {
        id: data.id,
        username: data.username,
        passwordHash: data.password_hash,
        role: data.role as Role,
        employeeId: data.employee_id,
        departmentId: data.department_id,
        departmentName: data.departments?.name,
        mustChangePassword: data.must_change_password
      };
      this.currentUser.set(user);
      localStorage.setItem('girassol_session', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('girassol_session');
    this.router.navigate(['/login']);
  }

  async changePassword(userId: string, newPass: string) {
    const { error } = await this.supabase.client
      .from('users')
      .update({
        password_hash: btoa(newPass),
        must_change_password: false
      })
      .eq('id', userId);

    if (!error && this.currentUser()?.id === userId) {
      const updated = { ...this.currentUser()!, passwordHash: btoa(newPass), mustChangePassword: false };
      this.currentUser.set(updated);
      localStorage.setItem('girassol_session', JSON.stringify(updated));
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(roles: Role[]): boolean {
    const u = this.currentUser();
    if (!u) return false;
    const upperRoles = roles.map(r => r.toUpperCase());
    return upperRoles.includes(u.role.toUpperCase());
  }

  async createUser(user: User) {
    await this.supabase.client
      .from('users')
      .insert({
        username: user.username,
        password_hash: user.passwordHash,
        role: user.role,
        employee_id: user.employeeId || null,
        department_id: user.departmentId || null,
        must_change_password: user.mustChangePassword ?? true
      });
  }

  async updateUser(user: User) {
    const { error } = await this.supabase.client
      .from('users')
      .update({
        username: user.username,
        role: user.role,
        department_id: user.departmentId,
        employee_id: user.employeeId
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user:', error);
      return false;
    }
    return true;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*, departments(name)');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(d => ({
      id: d.id,
      username: d.username,
      passwordHash: d.password_hash,
      role: d.role as Role,
      employeeId: d.employee_id,
      departmentId: d.department_id,
      departmentName: d.departments?.name,
      mustChangePassword: d.must_change_password
    }));
  }

  async deleteUser(userId: string) {
    const { error } = await this.supabase.client
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    return true;
  }
}