import { Component, inject, computed, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { PwaService } from '../../services/pwa.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  encapsulation: ViewEncapsulation.None, // Allow styles to affect global
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col md:flex-row print:bg-white">
      <!-- Inject Custom CSS from Developer Settings -->
      <!-- We use a hidden container to inject the style tag via innerHTML to ensure Angular doesn't strip it -->
      @if (safeStyleHtml()) {
        <div [innerHTML]="safeStyleHtml()" class="hidden"></div>
      }

      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 print:hidden no-print">
        <div class="p-6 border-b border-slate-700 flex flex-col items-center text-center">
          <img [src]="data.systemConfig().logoUrl" width="150" height="60" alt="Logo" class="mb-2 object-contain max-h-16" />
          <p class="text-xs text-slate-400 opacity-80">{{ data.systemConfig().appName }}</p>
        </div>

        <nav class="p-4 space-y-2">
          <a routerLink="/dashboard" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </a>
          
          @if (auth.hasRole(['ADMIN', 'MANAGER'])) {
            <a routerLink="/employees" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Funcionários
            </a>
            
            <a routerLink="/departments" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              Departamentos
            </a>

            <a routerLink="/import" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              Importar Dados (IA)
            </a>
          }

          <a routerLink="/attendance" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Presenças
          </a>

          @if (auth.hasRole(['ADMIN', 'MANAGER', 'COORDENADOR', 'DIRECTOR'])) {
            <a routerLink="/reports" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Relatórios
            </a>
          }
          
          <!-- Developer / Settings Tab -->
          @if (auth.hasRole(['ADMIN'])) {
             <div class="pt-4 mt-4 border-t border-slate-700">
               <p class="px-4 text-[10px] text-gray-500 font-bold uppercase mb-1">Administração</p>
               <a routerLink="/users" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  Utilizadores
               </a>
               <a routerLink="/settings" routerLinkActive="bg-yellow-500 text-slate-900 font-bold" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  Programador / Config
               </a>
             </div>
          }

          <button (click)="auth.logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-left mt-6">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sair
          </button>

          <!-- Mobile App Section -->
           <div class="pt-4 mt-4 border-t border-slate-700">
             <p class="px-4 text-[10px] text-gray-500 font-bold uppercase mb-1">Mobile App</p>
             
             @if (pwa.installable()) {
               <button (click)="pwa.promptInstall()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-left text-green-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Instalar App
               </button>
             }

             <a href="assets/downloads/app-release.apk" target="_blank" download class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                Baixar APK Android
             </a>
           </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center print:hidden no-print">
          <h1 class="text-xl font-bold text-slate-800">
            {{ data.systemConfig().appName }}
          </h1>
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
               <p class="text-sm font-bold text-gray-900">{{ auth.currentUser()?.username }}</p>
               <p class="text-xs text-gray-500">{{ auth.currentUser()?.role }}</p>
            </div>
          </div>
        </header>

        <!-- Content Scrollable -->
        <div class="flex-1 overflow-auto p-4 md:p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class LayoutComponent {
  auth = inject(AuthService);
  data = inject(DataService);
  pwa = inject(PwaService);
  sanitizer = inject(DomSanitizer);

  // Compute safe HTML for Custom CSS injection
  // Wrap in <style> tag to ensure it's treated as a style block when injected into div
  safeStyleHtml = computed(() => {
    const css = this.data.systemConfig().customCss;
    return css ? this.sanitizer.bypassSecurityTrustHtml(`<style>${css}</style>`) : '';
  });
}