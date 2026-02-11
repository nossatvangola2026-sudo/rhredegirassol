import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { SystemConfig } from '../../services/data.types';

@Component({
  selector: 'app-developer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (!isUnlocked()) {
       <div class="min-h-[60vh] flex flex-col items-center justify-center p-4">
          <div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-sm w-full text-center">
             <div class="mb-4 bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-gray-500">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             </div>
             <h2 class="text-xl font-bold text-gray-800 mb-2">Área Restrita</h2>
             <p class="text-sm text-gray-500 mb-6">Esta área é reservada para programadores. Insira a senha de acesso.</p>
             
             <form (submit)="unlock($event)" class="space-y-4">
               <input 
                 type="password" 
                 [(ngModel)]="passwordAttempt" 
                 name="password" 
                 class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none text-center tracking-widest text-lg"
                 placeholder="••••••••" 
                 autofocus>
               
               @if (errorMsg()) {
                 <p class="text-xs text-red-600 font-bold animate-pulse">{{ errorMsg() }}</p>
               }
               
               <button type="submit" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg">
                 Desbloquear
               </button>
             </form>
          </div>
       </div>
    } @else {
      <div class="space-y-8 pb-10">
        <div class="flex justify-between items-center border-b pb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              Gestão de Programador
            </h2>
            <p class="text-gray-500 text-sm">Controlo total do sistema, branding e dados.</p>
          </div>
          <button (click)="saveSettings()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-transform active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            Salvar Alterações
          </button>
        </div>

        <!-- Section 1: Branding & Info -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h3 class="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.357a4 4 0 115.656 5.656l-1.657 1.357"></path></svg>
            Identidade Visual (Branding)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Nome do Sistema</label>
                <input type="text" [(ngModel)]="config.appName" class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Girassol RH">
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Logo URL</label>
                <input type="text" [(ngModel)]="config.logoUrl" class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="https://...">
                <p class="text-xs text-gray-400">Recomendado: Imagem PNG transparente, fundo claro/escuro compatível.</p>
              </div>
              <div class="col-span-2 space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Descrição do Sistema</label>
                <input type="text" [(ngModel)]="config.description" class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
              </div>
          </div>
        </div>

        <!-- Section 2: Frontend Customization (CSS) -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <h3 class="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            Frontend Avançado (CSS Injection)
          </h3>
          <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">CSS Personalizado</label>
              <textarea [(ngModel)]="config.customCss" rows="6" class="w-full px-4 py-2 border rounded-lg bg-slate-900 text-green-400 font-mono text-xs focus:ring-purple-500 focus:border-purple-500" placeholder="/* Exemplo: Alterar cor do cabeçalho */ .bg-slate-900 { background-color: #004d40 !important; }"></textarea>
              <div class="flex justify-between items-center mt-2">
                 <p class="text-xs text-gray-500 flex-1 mr-4">
                   ⚠️ <strong>Atenção Programador:</strong> Este CSS será injetado globalmente na aplicação. Use com cuidado.
                 </p>
                 <button (click)="applyCss()" class="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded shadow flex items-center gap-2 transition-transform active:scale-95">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Executar CSS
                 </button>
              </div>
          </div>
        </div>

        <!-- Section: Licensing and Security -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <h3 class="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Licenciamento e Segurança
          </h3>
          <div class="space-y-4">
             <div class="p-4 bg-red-50 rounded text-sm text-red-800 border border-red-200">
                <strong>Configuração de Bloqueio Automático:</strong> <br>
                Bloqueio programado para: <strong>{{ getExpirationDate() | date:'dd/MM/yyyy' }}</strong>. <br>
                O sistema exibirá aviso de avaliação até essa data.
             </div>
             
             <!-- Extension Controls -->
             <div class="p-4 bg-gray-50 rounded border border-gray-200 space-y-3">
                <div class="flex justify-between items-center">
                   <span class="text-sm font-bold text-gray-700">Extender Validade:</span>
                </div>
                
                <div class="flex gap-2">
                   <button (click)="extendValidity(1)" class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-2 rounded transition">+1 Mês</button>
                   <button (click)="extendValidity(6)" class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-2 rounded transition">+6 Meses</button>
                   <button (click)="extendValidity(12)" class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-2 rounded transition">+1 Ano</button>
                </div>

                <div class="pt-2 mt-2 border-t border-gray-200">
                   <button (click)="setPremium()" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-2 rounded shadow flex justify-center items-center gap-2 transition transform active:scale-95">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      Tornar Premium (Vitalício)
                   </button>
                </div>
             </div>

             <div class="space-y-2">
                 <label class="block text-sm font-semibold text-gray-700">Chave de Ativação (Manual)</label>
                 <input type="text" [(ngModel)]="config.licenseKey" class="w-full px-4 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 font-mono tracking-widest text-gray-600 font-bold" placeholder="Insira a chave de desbloqueio">
             </div>
          </div>
        </div>

        <!-- Section 3: SQL / Data Console -->
        <div class="bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500 text-gray-200">
          <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Terminal SQL
          </h3>
          
          <div class="space-y-3">
              <div class="flex justify-between text-xs font-mono text-gray-400 mb-1">
                <span>Tabelas Disponíveis: employees, departments, attendance, justifications</span>
                <span>Modo JS: Inicie com "JS:"</span>
              </div>
              
              <div class="relative">
                <textarea 
                  [(ngModel)]="sqlQuery" 
                  rows="3" 
                  class="w-full px-4 py-3 bg-gray-900 text-green-400 font-mono text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                  placeholder="SELECT * FROM employees"
                  (keydown.control.enter)="executeSql()">
                </textarea>
                <button 
                  (click)="executeSql()"
                  class="absolute bottom-3 right-3 bg-green-700 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Executar
                </button>
              </div>

              <!-- Output Console -->
              @if (queryResult) {
                <div class="mt-4">
                    <p class="text-xs text-gray-500 mb-1">Resultado:</p>
                    <pre class="bg-black text-xs text-green-300 p-4 rounded-lg overflow-x-auto max-h-60 border border-gray-700">{{ queryResult }}</pre>
                </div>
              }
          </div>
        </div>

        <!-- Section 4: Backend / Data Management -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <h3 class="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            Limpeza de Dados
          </h3>
          
          <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <h4 class="font-bold text-red-800">Limpar Histórico de Presenças</h4>
                <p class="text-sm text-red-600">Elimina apenas os dados de presença, falta e justificativos. Mantém funcionários e configurações.</p>
              </div>
              <button (click)="confirmReset()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow">
                Executar Limpeza
              </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DeveloperSettingsComponent {
  data = inject(DataService);

  // Local copy for editing
  config: SystemConfig = { ...this.data.systemConfig() };

  sqlQuery = '';
  queryResult = '';

  // Lock State
  isUnlocked = signal(false);
  passwordAttempt = '';
  errorMsg = signal('');

  unlock(e: Event) {
    e.preventDefault();
    if (this.passwordAttempt === 'Angola1988*#*') {
      this.isUnlocked.set(true);
      this.errorMsg.set('');
    } else {
      this.errorMsg.set('Acesso Negado: Senha incorreta.');
      this.passwordAttempt = '';
    }
  }

  async saveSettings() {
    await this.data.updateConfig(this.config);
    alert('Configurações salvas com sucesso! A página será recarregada.');
    window.location.reload();
  }

  async applyCss() {
    // Updates only the system config in the service without reloading the page
    const current = this.data.systemConfig();
    await this.data.updateConfig({ ...current, customCss: this.config.customCss });
    alert('CSS Aplicado e salvo com sucesso!');
  }

  getExpirationDate() {
    return this.config.licenseExpirationDate ? new Date(this.config.licenseExpirationDate) : new Date('2026-05-01T00:00:00');
  }

  extendValidity(months: number) {
    const current = this.getExpirationDate();
    const newDate = new Date(current);
    newDate.setMonth(newDate.getMonth() + months);
    this.config.licenseExpirationDate = newDate.toISOString();
    alert(`Data de validade estendida para: ${newDate.toLocaleDateString()}.\nClique em "Salvar Alterações" para confirmar.`);
  }

  setPremium() {
    this.config.licenseKey = 'IVAN-LIMA-PREMIUM-UNLOCK';
    alert('Modo Premium ativado! Clique em "Salvar Alterações" para confirmar.');
  }

  async confirmReset() {
    if (confirm('ATENÇÃO: Esta ação eliminará TODAS as presenças, faltas e justificativas registadas. \n\nOs dados dos funcionários e configurações SERÃO MANTIDOS.\n\nDeseja continuar?')) {
      await this.data.resetAttendanceOnly();
      alert('Histórico de presenças e justificativas foi apagado com sucesso.');
    }
  }

  executeSql() {
    const cmd = this.sqlQuery.trim();
    if (!cmd) return;

    const lowerCmd = cmd.toLowerCase();
    let output: any = 'Comando não reconhecido ou inválido para LocalStorage.\nTente: SELECT * FROM employees ou JS: data.employees()';

    try {
      // 1. SELECT Simulation
      if (lowerCmd.startsWith('select')) {
        if (lowerCmd.includes('employees') || lowerCmd.includes('funcionarios')) output = this.data.employees();
        else if (lowerCmd.includes('departments') || lowerCmd.includes('departamentos')) output = this.data.departments();
        else if (lowerCmd.includes('attendance') || lowerCmd.includes('presencas')) output = this.data.attendance();
        else if (lowerCmd.includes('justifications')) output = this.data.justifications();
        else output = "Tabela não encontrada. Tabelas válidas: employees, departments, attendance, justifications.";
      }
      // 2. DELETE Simulation
      else if (lowerCmd.startsWith('delete from')) {
        const tableName = lowerCmd.split('from')[1]?.trim();
        if (confirm(`Ação Irreversível: Tem a certeza que deseja apagar a tabela [${tableName}]?`)) {
          if (lowerCmd.includes('attendance')) { this.data.attendance.set([]); output = 'Table [Attendance] truncated (0 rows).'; }
          else if (lowerCmd.includes('justifications')) { this.data.justifications.set([]); output = 'Table [Justifications] truncated (0 rows).'; }
          else if (lowerCmd.includes('employees')) { this.data.employees.set([]); output = 'Table [Employees] truncated (0 rows).'; }
          else if (lowerCmd.includes('departments')) { this.data.departments.set([]); output = 'Table [Departments] truncated (0 rows).'; }
          else output = `Tabela '${tableName}' não encontrada.`;
        } else {
          output = 'Operação cancelada pelo utilizador.';
        }
      }
      // 3. Advanced JS Execution
      else if (cmd.startsWith('JS:')) {
        const jsCode = cmd.substring(3);
        // Safe-ish eval using Function constructor accessing 'data' scope
        const fn = new Function('data', 'return ' + jsCode);
        const res = fn(this.data);
        // If it's a signal, unwrap it for display
        output = typeof res === 'function' && res.name?.includes('signal') ? res() : res;
      }
    } catch (err: any) {
      output = `Erro de Execução: ${err.message}`;
    }

    // Format output
    if (Array.isArray(output)) {
      this.queryResult = `Registos encontrados: ${output.length}\n\n` + JSON.stringify(output, null, 2);
    } else if (typeof output === 'object') {
      this.queryResult = JSON.stringify(output, null, 2);
    } else {
      this.queryResult = String(output);
    }
  }
}