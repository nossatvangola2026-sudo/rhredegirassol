import { Component, inject, computed, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  template: `
    @if (isLocked()) {
      <div class="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center p-8 z-50 text-center font-sans">
        <div class="bg-red-600 p-6 rounded-full mb-8 animate-bounce shadow-lg">
           <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 class="text-5xl font-extrabold mb-4 tracking-tight">LICENÇA EXPIRADA</h1>
        <p class="text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
          O período de avaliação deste sistema terminou em <strong>{{ expirationDate() | date:'dd/MM/yyyy' }}</strong>. Para continuar a utilizar, é necessário reactivar a licença junto do desenvolvedor.
        </p>
        
        <div class="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl">
           <h2 class="text-xl font-bold mb-6 text-yellow-500 uppercase tracking-wide border-b border-gray-700 pb-2">Contacte o Programador</h2>
           <div class="space-y-5 text-left">
              <div class="flex items-center gap-4">
                 <div class="bg-gray-700 p-2 rounded-lg"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
                 <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Nome</p>
                    <p class="font-bold text-lg text-white">Ivan Lima</p>
                 </div>
              </div>
              <div class="flex items-center gap-4">
                 <div class="bg-gray-700 p-2 rounded-lg"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                 <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">Email</p>
                    <a href="mailto:servicos.ivanlima@gmail.com" class="font-bold text-blue-400 hover:text-blue-300 transition-colors">servicos.ivanlima@gmail.com</a>
                 </div>
              </div>
              <div class="flex items-center gap-4">
                 <div class="bg-gray-700 p-2 rounded-lg block"><svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                 <div>
                    <p class="text-xs text-gray-500 uppercase font-bold">WhatsApp</p>
                    <p class="font-bold text-lg text-green-400">+244 923066682</p>
                 </div>
              </div>
           </div>

           <!-- Emergency Unlock -->
           <div class="mt-8 pt-6 border-t border-gray-700 w-full animate-fade-in">
              <h3 class="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">Área Técnica (Desbloqueio)</h3>
              <div class="flex gap-2">
                 <input type="password" [(ngModel)]="unlockKey" (keyup.enter)="tryToUnlock()" placeholder="Inserir Chave de Ativação" class="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm transition-all shadow-inner">
                 <button (click)="tryToUnlock()" class="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all focus:ring-2 focus:ring-green-400 shadow-lg flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                 </button>
              </div>
              @if (unlockError()) {
                 <p class="text-red-400 text-xs mt-2 font-bold animate-pulse">{{ unlockError() }}</p>
              }
           </div>
        </div>
        <p class="mt-8 text-gray-500 text-sm">ID do Sistema: {{ getSystemId() }}</p>
      </div>
    } @else {
      <!-- Trial Notice -->
      @if (showTrialNotice()) {
        <div class="bg-indigo-600 text-white text-xs py-2 px-4 text-center font-bold shadow-md flex justify-center items-center gap-2 no-print">
          <span class="bg-white text-indigo-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Avaliação</span>
          Sistema em fase de avaliação até {{ expirationDate() | date:'dd/MM/yyyy' }}.
        </div>
      }
      <router-outlet></router-outlet>
    }
  `
})
export class AppComponent {
  private dataService = inject(DataService);

  unlockKey = '';
  unlockError = signal('');

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.dataService.deferredPrompt.set(e);
    console.log('PWA installation prompt captured and stashed.');
  }

  expirationDate = computed(() => {
    const config = this.dataService.systemConfig();
    return config.licenseExpirationDate ? new Date(config.licenseExpirationDate) : new Date('2026-05-01T00:00:00');
  });

  // Computed property to determine lock status
  isLocked = computed(() => {
    const config = this.dataService.systemConfig();
    const now = this.dataService.serverTime();

    // Check if activated
    if (config.licenseKey === 'IVAN-LIMA-PREMIUM-UNLOCK') {
      return false;
    }

    // Lock if current date is past expiration
    return now >= this.expirationDate();
  });

  showTrialNotice = computed(() => {
    if (this.isLocked()) return false;
    const config = this.dataService.systemConfig();
    if (config.licenseKey === 'IVAN-LIMA-PREMIUM-UNLOCK') return false;
    return true;
  });

  getSystemId() {
    return 'GIRASSOL-RH-2026';
  }

  async tryToUnlock() {
    if (this.unlockKey === 'IVAN-LIMA-PREMIUM-UNLOCK') {
      const current = this.dataService.systemConfig();
      await this.dataService.updateConfig({ ...current, licenseKey: this.unlockKey });
      this.unlockError.set('');
      alert('Sistema desbloqueado com sucesso!');
    } else {
      this.unlockError.set('Chave de ativação inválida.');
    }
  }
}