import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <!-- Decoration -->
      <div class="absolute top-0 left-0 w-full h-2 bg-yellow-500"></div>
      
      <div class="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden z-10">
        <div class="bg-slate-800 p-8 text-center border-b-4 border-yellow-500">
           <img [src]="data.systemConfig().logoUrl" width="180" height="70" alt="Logo" class="mx-auto mb-4 object-contain max-h-20" />
           <h2 class="text-white text-lg font-light">{{ data.systemConfig().appName }}</h2>
        </div>

        <div class="p-8">
          @if (error()) {
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm">
              {{ error() }}
            </div>
          }

          @if (!showChangePassword()) {
            <!-- Login Form -->
            <form (submit)="onLogin($event)">
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">Usuário</label>
                <input type="text" [(ngModel)]="username" name="username" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="rhadmin" required>
              </div>
              <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2">Senha</label>
                <input type="password" [(ngModel)]="password" name="password" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="••••••" required>
              </div>
              <button type="submit" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
                Entrar
              </button>
            </form>
          } @else {
            <!-- Change Password Form -->
            <div class="mb-4 text-sm text-gray-600">
              É necessário alterar a sua senha no primeiro acesso.
            </div>
            <form (submit)="onChangePassword($event)">
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">Nova Senha</label>
                <input type="password" [(ngModel)]="newPassword" name="newPassword" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" required>
              </div>
              <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2">Confirmar Nova Senha</label>
                <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" required>
              </div>
              <button type="submit" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
                Atualizar Senha
              </button>
            </form>
          }
        </div>
      </div>
      
      <div class="mt-8 text-slate-500 text-xs text-center">
        {{ data.systemConfig().description }}
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  data = inject(DataService);
  router: Router = inject(Router);

  username = '';
  password = '';
  newPassword = '';
  confirmPassword = '';

  error = signal('');
  showChangePassword = signal(false);

  async onLogin(e: Event) {
    e.preventDefault();
    this.error.set('');

    if (await this.auth.login(this.username, this.password)) {
      const user = this.auth.currentUser();
      if (user?.mustChangePassword) {
        this.showChangePassword.set(true);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.error.set('Credenciais inválidas.');
    }
  }

  async onChangePassword(e: Event) {
    e.preventDefault();
    this.error.set('');

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('As senhas não coincidem.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      await this.auth.changePassword(user.id, this.newPassword);
      this.showChangePassword.set(false);
      this.router.navigate(['/dashboard']);
    }
  }
}