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
              <div class="col-span-1 space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Descrição do Sistema</label>
                <input type="text" [(ngModel)]="config.description" class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div class="space-y-2">
                  <label class="block text-sm font-semibold text-gray-700 font-mono flex items-center gap-2">
                    IP do Biométrico (ZK)
                    <button (click)="searchDevices()" 
                            [disabled]="scanning"
                            class="ml-auto text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition flex items-center gap-1">
                      <svg [class.animate-spin]="scanning" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      {{ scanning ? 'A procurar...' : 'Procurar na Rede' }}
                    </button>
                  </label>
                  <div class="relative">
                    <input type="text" [(ngModel)]="config.biometricIp" class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono" placeholder="ex: 192.168.1.100">
                    
                    <!-- Scan Results Dropdown -->
                    @if (data.systemConfig().bridgeScanResults?.length) {
                      <div class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                        <div class="p-2 text-[10px] font-bold text-gray-400 bg-gray-50 uppercase">Dispositivos Encontrados:</div>
                        @for (res of data.systemConfig().bridgeScanResults; track res.ip) {
                          <button (click)="config.biometricIp = res.ip" class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition flex justify-between">
                            <span class="font-mono">{{ res.ip }}</span>
                            <span class="text-xs text-gray-400">Porta 4370</span>
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <p class="text-[10px] text-gray-400">Usado pela ponte local para sincronização em tempo real.</p>
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

              <!-- Bridge Status Card -->
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4">
                <h4 class="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Ponte de Comunicação (Middleware)
                </h4>
                
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div [class]="'w-3 h-3 rounded-full ' + (data.systemConfig().bridgeStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400')"></div>
                    <span class="text-sm font-bold text-gray-700">
                      Estado: {{ data.systemConfig().bridgeStatus || 'OFFLINE' }}
                    </span>
                  </div>
                  <span class="text-[10px] text-gray-400 italic">Visto em: {{ data.systemConfig().bridgeLastSeen | date:'HH:mm:ss dd/MM' }}</span>
                </div>

                <div class="bg-gray-900 rounded p-3 font-mono text-[10px] text-green-400 min-h-[40px] border border-gray-800">
                   <p class="opacity-50 text-[8px] mb-1">Última actividade da ponte:</p>
                   {{ data.systemConfig().bridgeLog || 'A aguardar sinal da ponte local...' }}
                </div>
                
                <p class="text-[9px] text-gray-500 mt-2 leading-tight">
                  <svg class="w-3 h-3 inline text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                  A ponte local é necessária para ligar o aparelho à nuvem. Configure o IP acima e inicie o script <code>biometric-bridge.js</code>.
                </p>
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

        <!-- Section 6: Biometric Monitor -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500 overflow-hidden">
          <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.268 0 2.39.234 3.414.659m-4.742 7.318l-3.042-4.13m8.174 8.54l-3.042-4.13l3.042-4.13m-2.5 9.25a2.41 2.41 0 11-4.82 0 2.41 2.41 0 014.82 0z"></path></svg>
                Monitor Biométrico (Device Data)
              </h3>
              <div class="flex gap-2">
                <span class="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                  Cache: {{ data.biometricUsers().length }} Utilizadores
                </span>
                <button (click)="data.reloadData()" class="p-1 hover:bg-gray-100 rounded transition" title="Recarregar Dados">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
              </div>
          </div>

          <div class="p-4 bg-indigo-50 rounded-lg mb-4 text-xs text-indigo-800 border border-indigo-100 flex items-start gap-3">
             <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <div>
               <strong>Como ler este monitor:</strong> Os dados abaixo vêm directamente do aparelho físico via Middleware. 
               Se um utilizador estiver <span class="text-green-600 font-bold">VINCULADO</span>, significa que o ID na máquina corresponde ao Nº de Funcionário no sistema de RH.
             </div>
          </div>

          <div class="overflow-x-auto border rounded-lg">
              <table class="w-full text-left text-sm">
                  <thead class="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                          <th class="px-4 py-3">ID MÁQUINA</th>
                          <th class="px-4 py-3">NOME NO DISPOSITIVO</th>
                          <th class="px-4 py-3">CARTÃO/UID</th>
                          <th class="px-4 py-3">STATUS DE VÍNCULO</th>
                          <th class="px-4 py-3">ÚLTIMA SINCRONIZAÇÃO</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y">
                      @for (user of data.biometricUsers(); track user.id) {
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3 font-mono font-bold text-indigo-600">{{ user.deviceUserId }}</td>
                            <td class="px-4 py-3">{{ user.name || '---' }}</td>
                            <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ user.cardNumber || 'Sem Cartão' }}</td>
                            <td class="px-4 py-3">
                                @if (isLinked(user.deviceUserId)) {
                                  <span class="flex items-center gap-1 text-green-600 font-bold">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                    VINCULADO ({{ getEmployeeName(user.deviceUserId) }})
                                  </span>
                                } @else {
                                  <span class="flex items-center gap-1 text-amber-500 font-medium">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                                    NÃO ENCONTRADO NO RH
                                  </span>
                                }
                            </td>
                            <td class="px-4 py-3 text-gray-500 text-xs italic">{{ user.lastSync | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                        </tr>
                      } @empty {
                        <tr>
                            <td colspan="5" class="px-4 py-10 text-center text-gray-400 italic">
                                Sem dados do dispositivo. Certifique-se que o Middleware está em execução.
                            </td>
                        </tr>
                      }
                  </tbody>
              </table>
          </div>
        </div>

        <!-- Section 4: Backend / Data Management -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <h3 class="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            Gestão Crítica de Dados
          </h3>
          
          <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <h4 class="font-bold text-red-800">Limpar Histórico de Presenças</h4>
                    <p class="text-sm text-red-600">Elimina presenças e justificativos. Mantém funcionários.</p>
                  </div>
                  <button (click)="confirmReset()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow">
                    Limpar Presenças
                  </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div>
                    <h4 class="font-bold text-orange-800">Reset de Utilizadores</h4>
                    <p class="text-sm text-orange-600">Apaga todos os utilizadores excepto o "admin".</p>
                  </div>
                  <button (click)="resetUsers()" class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded shadow">
                    Wipe Utilizadores
                  </button>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div>
                    <h4 class="font-bold text-white">FACTORY RESET (HARD)</h4>
                    <p class="text-sm text-gray-400">Apaga TUDO (Funcionários, Presenças, Justificativos).</p>
                  </div>
                  <button (click)="hardResetAll()" class="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded shadow">
                    Reset Total
                  </button>
              </div>
          </div>
        </div>

        <!-- Section 5: System Diagnostics -->
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
          <h3 class="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            Diagnóstico do Sistema
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 uppercase font-bold mb-1">Status Base de Dados</p>
                  <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span class="text-sm font-bold text-gray-800">Supabase Online</span>
                  </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 uppercase font-bold mb-1">Versão do LocalStorage</p>
                  <span class="text-sm font-mono text-gray-800">v2.1.0-biometric</span>
              </div>
              <div class="flex items-center">
                  <button (click)="testConnection()" class="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Testar Conexão Supabase
                  </button>
              </div>
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
    await this.data.resetAttendanceOnly();
  }

  async resetUsers() {
    await this.data.hardResetUsers();
  }

  async hardResetAll() {
    await this.data.resetAllData();
  }

  scanning = false;

  async searchDevices() {
    this.scanning = true;
    await this.data.triggerBiometricScan();
    // A cada 1s o DataService actualiza o bridgeScanResults via realtime
    // Vamos esperar 5s e parar a animação
    setTimeout(() => {
      this.scanning = false;
    }, 8000);
  }

  async testConnection() {
    try {
      this.queryResult = 'Testando conexão...\n';
      const start = Date.now();
      await this.data.reloadData();
      const end = Date.now();
      this.queryResult += `✅ Conexão com Supabase bem-sucedida!\n⏱️ Tempo de resposta: ${end - start}ms\n📡 Tabelas acessíveis: ${this.data.employees().length} funcionários carregados.`;
      alert('Teste de conexão concluído com sucesso!');
    } catch (err: any) {
      this.queryResult = `❌ Erro na conexão: ${err.message}`;
      alert('Falha ao conectar com o Supabase.');
    }
  }

  isLinked(deviceUserId: string): boolean {
    return this.data.employees().some(e => e.employeeNumber === deviceUserId);
  }

  getEmployeeName(deviceUserId: string): string {
    const emp = this.data.employees().find(e => e.employeeNumber === deviceUserId);
    return emp ? emp.fullName : '---';
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
        const parts = lowerCmd.split('from');
        const tableName = parts.length > 1 ? parts[1].trim() : '';
        if (tableName && confirm(`Ação Irreversível: Tem a certeza que deseja apagar a tabela [${tableName}]?`)) {
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