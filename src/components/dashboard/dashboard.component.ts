import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Painel de Controle</h2>
          <p class="text-sm text-gray-500">Gestão centralizada de funcionários e presenças.</p>
        </div>

        <!-- Month/Year Selector -->
        <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-gray-500 uppercase px-1">Mês:</label>
            <select [(ngModel)]="selectedMonth" 
                    class="bg-white border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              @for (m of months; track $index) {
                <option [value]="$index">{{ m }}</option>
              }
            </select>
          </div>
          <div class="flex items-center gap-2 border-l pl-3">
            <label class="text-xs font-bold text-gray-500 uppercase px-1">Ano:</label>
            <select [(ngModel)]="selectedYear" 
                    class="bg-white border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              @for (y of years; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
          </div>
        </div>
      </div>
      
      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card 1 -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500 font-medium">Total Funcionários</p>
              <h3 class="text-3xl font-bold text-gray-800 mt-2">{{ totalEmployees() }}</h3>
            </div>
            <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500 font-medium">Faltas (Mês)</p>
              <h3 class="text-3xl font-bold text-gray-800 mt-2">{{ monthlyAbsences() }}</h3>
            </div>
            <div class="p-2 bg-red-50 rounded-lg text-red-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500 font-medium">Atrasos (Mês)</p>
              <h3 class="text-3xl font-bold text-gray-800 mt-2">{{ monthlyDelays() }}</h3>
            </div>
            <div class="p-2 bg-yellow-50 rounded-lg text-yellow-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Card 4 -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500 font-medium">Justificações Pend.</p>
              <h3 class="text-3xl font-bold text-gray-800 mt-2">{{ pendingJustifications() }}</h3>
            </div>
            <div class="p-2 bg-purple-50 rounded-lg text-purple-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity / List -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-800">Funcionários Ativos</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50 text-gray-900 font-medium border-b">
              <tr>
                <th class="px-6 py-3">Nome</th>
                <th class="px-6 py-3">Departamento</th>
                <th class="px-6 py-3">Cargo</th>
                <th class="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (emp of data.employees(); track emp.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">{{ emp.fullName }}</td>
                  <td class="px-6 py-4">{{ emp.department }}</td>
                  <td class="px-6 py-4">{{ emp.jobTitle }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {{ emp.status }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-6 py-4 text-center text-gray-400">Nenhum funcionário cadastrado.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  data = inject(DataService);

  // Filter Signals
  selectedMonth = signal<number>(new Date().getMonth());
  selectedYear = signal<number>(new Date().getFullYear());

  months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  years = [2024, 2025, 2026];

  totalEmployees = computed(() => this.data.employees().length);

  monthlyAbsences = computed(() => {
    const month = this.selectedMonth();
    const year = this.selectedYear();

    return this.data.attendance().filter(a => {
      const recordDate = new Date(a.date);
      // a.date is YYYY-MM-DD, but new Date() might have timezone issues. 
      // safer way:
      const [y, m, d] = a.date.split('-').map(Number);
      return a.status === 'ABSENT' && (m - 1) === month && y === year;
    }).length;
  });

  monthlyDelays = computed(() => {
    const month = this.selectedMonth();
    const year = this.selectedYear();

    return this.data.attendance().filter(a => {
      const [y, m, d] = a.date.split('-').map(Number);
      return a.status === 'LATE' && (m - 1) === month && y === year;
    }).length;
  });

  pendingJustifications = computed(() => {
    return this.data.justifications().filter(j => j.status === 'PENDING').length;
  });

  downloadInstaller() {
    const message = `Para gerar o instalador desktop (.exe):
1. No terminal, execute: npm run electron:build
2. O ficheiro .exe será criado na pasta "release".
3. Faça o upload desse ficheiro para o Supabase Storage.
4. Substitua o link aqui no Dashboard pelo link público do arquivo.`;

    alert(message);
  }

  async showPWAInstructions() {
    const promptEvent = this.data.deferredPrompt();

    if (promptEvent) {
      // Trigger the native browser install prompt
      promptEvent.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await promptEvent.userChoice;
      console.log(`PWA install outcome: ${outcome}`);

      // Clear the prompt so it's not reused
      this.data.deferredPrompt.set(null);
    } else {
      // Fallback to manual instructions if the prompt isn't available (e.g., already installed or browser doesn't support)
      const message = `Para instalar a Versão PWA (Mais Rápida):

  No Computador (Chrome/Edge):
  1. Clique no ícone de "Instalar" na barra de endereços (computador com uma seta).
  2. Clique em "Instalar".

  No Telemóvel (iPhone/Android):
  1. Clique no botão de "Partilhar" (iOS) ou nos 3 pontinhos (Android).
  2. Selecione "Adicionar ao Ecrã Principal".

  O app ficará instalado como um ícone nativo no seu dispositivo!`;

      alert(message);
    }
  }
}