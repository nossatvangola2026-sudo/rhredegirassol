import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { User, Role } from '../../services/data.types';

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Gestão de Utilizadores</h2>
          <p class="text-gray-500 text-sm">Administre os acessos e funções (Admin, Gerente, Coordenador).</p>
        </div>
        <button (click)="openModal()" class="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Novo Utilizador
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table class="w-full text-left text-sm text-gray-600">
          <thead class="bg-gray-50 text-gray-900 font-bold uppercase text-xs tracking-wider border-b">
            <tr>
              <th class="px-6 py-4">Utilizador</th>
              <th class="px-6 py-4">Função</th>
              <th class="px-6 py-4">Departamento</th>
              <th class="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (user of users(); track user.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-900">{{ user.username }}</td>
                <td class="px-6 py-4">
                  <span [class]="getRoleBadgeClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  {{ user.departmentName || '-' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2">
                    <button (click)="initiateEdit(user)" class="text-blue-500 hover:text-blue-700 p-1.5 rounded transition-colors" title="Editar">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button (click)="initiateDelete(user)" class="text-red-500 hover:text-red-700 p-1.5 rounded transition-colors" title="Eliminar">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-400 italic">Nenhum utilizador encontrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div class="bg-slate-900 px-6 py-4 flex justify-between items-center text-white font-bold">
              <h3>{{ isEditing() ? 'Editar Utilizador' : 'Criar Novo Utilizador' }}</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form (submit)="saveUser($event)" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome de Utilizador</label>
                <input type="text" [(ngModel)]="newUser.username" name="username" class="w-full px-3 py-2 border rounded-lg focus:ring-slate-500" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ isEditing() ? 'Nova Senha (opcional)' : 'Senha Inicial' }}</label>
                <input type="password" [(ngModel)]="password" name="password" class="w-full px-3 py-2 border rounded-lg focus:ring-slate-500" [required]="!isEditing()">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Função (Role)</label>
                <select [(ngModel)]="newUser.role" name="role" class="w-full px-3 py-2 border rounded-lg" required>
                  <option value="ADMIN">ADMIN (Controlo Total)</option>
                  <option value="MANAGER">MANAGER (Gestor de RH)</option>
                  <option value="COORDENADOR">COORDENADOR (Chefe de Dept.)</option>
                  <option value="DIRECTOR">DIRECTOR (Director de Dept.)</option>
                </select>
              </div>

              @if (newUser.role === 'COORDENADOR' || newUser.role === 'DIRECTOR') {
                <div class="animate-slide-down">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <select [(ngModel)]="newUser.departmentId" name="departmentId" class="w-full px-3 py-2 border rounded-lg" required>
                    <option [ngValue]="undefined" disabled>Selecione o Departamento...</option>
                    @for (dept of data.departments(); track dept.id) {
                      <option [value]="dept.id">{{ dept.name }}</option>
                    }
                  </select>
                  <p class="text-[10px] text-gray-500 mt-1 italic">O coordenador terá acesso apenas aos dados deste departamento.</p>
                </div>
              }

              <div class="pt-4 flex justify-end gap-3 border-t">
                <button type="button" (click)="closeModal()" class="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-md">
                   {{ isEditing() ? 'Guardar Alterações' : 'Criar Utilizador' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <h3 class="text-lg font-bold text-gray-900 mb-2">Eliminar Utilizador?</h3>
            <p class="text-sm text-gray-500 mb-6 font-bold text-red-600 uppercase">Atenção: Esta ação é irreversível.</p>
            <div class="flex gap-3 justify-center">
               <button (click)="showDeleteModal.set(false)" class="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
               <button (click)="confirmDelete()" class="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Sim, Eliminar</button>
            </div>
          </div>
        </div>
      }
    </div>
    `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UserManagerComponent implements OnInit {
  auth = inject(AuthService);
  data = inject(DataService);

  users = signal<User[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  showDeleteModal = signal(false);
  userToDelete = signal<string | null>(null);

  newUser: Partial<User> = { role: 'COORDENADOR' };
  password = '';

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    const list = await this.auth.getUsers();
    this.users.set(list);
  }

  openModal(user?: User) {
    if (user) {
      this.isEditing.set(true);
      this.newUser = { ...user };
      this.password = '';
    } else {
      this.isEditing.set(false);
      this.newUser = { role: 'COORDENADOR', mustChangePassword: true };
      this.password = '';
    }
    this.showModal.set(true);
  }

  initiateEdit(user: User) {
    this.openModal(user);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveUser(e: Event) {
    e.preventDefault();
    if (!this.newUser.username) return;

    if (this.isEditing()) {
      await this.auth.updateUser(this.newUser as User);
      if (this.password) {
        await this.auth.changePassword(this.newUser.id!, this.password);
      }
    } else {
      if (!this.password) return;
      const user: User = {
        username: this.newUser.username,
        passwordHash: btoa(this.password),
        role: this.newUser.role as Role,
        departmentId: this.newUser.departmentId,
        mustChangePassword: true
      } as User;
      await this.auth.createUser(user);
    }

    this.closeModal();
    await this.loadUsers();
  }

  initiateDelete(user: User) {
    if (user.username === 'rhadmin') {
      alert('Não é possível eliminar o utilizador mestre.');
      return;
    }
    this.userToDelete.set(user.id || null);
    this.showDeleteModal.set(true);
  }

  async confirmDelete() {
    const id = this.userToDelete();
    if (id) {
      await this.auth.deleteUser(id);
      this.showDeleteModal.set(false);
      await this.loadUsers();
    }
  }

  getRoleBadgeClass(role: Role): string {
    const base = 'px-2 py-1 rounded-full text-[10px] font-bold uppercase ';
    if (role === 'ADMIN') return base + 'bg-red-100 text-red-700';
    if (role === 'MANAGER') return base + 'bg-blue-100 text-blue-700';
    if (role === 'COORDENADOR') return base + 'bg-purple-100 text-purple-700';
    return base + 'bg-gray-100 text-gray-700';
  }
}
