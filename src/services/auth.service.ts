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
      .select('*')
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
        must_change_password: user.mustChangePassword ?? true
      });
  }
}