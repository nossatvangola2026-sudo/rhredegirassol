import { Component, inject, signal, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { AttendanceRecord, Employee, Justification } from '../../services/data.types';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border-b-4 border-yellow-500 flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Controlo de Presenças</h2>
          <p class="text-gray-500">{{ today | date:'fullDate' }}</p>
        </div>
        
        <!-- Button specifically for Exceptions -->
        <button (click)="openExceptionModal()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition transform hover:-translate-y-0.5">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           Lançar Falta / Atraso
        </button>
      </div>

      <!-- Exception Entry Modal (Strictly Faltas/Atrasos) -->
      @if (showExceptionModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
             <!-- Red Header to indicate Exception/Alert -->
             <div class="bg-red-600 px-6 py-4 flex justify-between items-center">
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Registar Falta ou Atraso
                </h3>
                <button (click)="showExceptionModal.set(false)" class="text-red-100 hover:text-white">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             
             <form (submit)="saveExceptionRecord($event)" class="p-6 space-y-4">
                <!-- Employee & Date -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                     <label class="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
                     <!-- Search Filter -->
                     <input 
                       type="text" 
                       [ngModel]="modalSearchQuery()" 
                       (ngModelChange)="modalSearchQuery.set($event)"
                       [ngModelOptions]="{standalone: true}" 
                       placeholder="Pesquisar funcionário..." 
                       class="w-full px-3 py-1 mb-1 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:border-red-500"
                     >
                     <select [(ngModel)]="exceptionEntry.employeeId" [ngModelOptions]="{standalone: true}" class="w-full px-3 py-2 border rounded-lg bg-white focus:ring-red-500 focus:border-red-500" required>
                        <option value="" disabled>Selecione...</option>
                        @for (emp of filteredEmployeesForModal(); track emp.id) {
                          <option [value]="emp.id">{{ emp.fullName }} ({{ emp.employeeNumber }})</option>
                        }
                     </select>
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 mb-1">Data da Ocorrência</label>
                     <input type="date" [(ngModel)]="exceptionEntry.date" name="date" class="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500" required>
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Registo</label>
                     <select [(ngModel)]="exceptionEntry.type" name="type" class="w-full px-3 py-2 border rounded-lg bg-white font-bold" [class.text-red-600]="exceptionEntry.type === 'ABSENT'" [class.text-yellow-600]="exceptionEntry.type === 'LATE'">
                        <option value="ABSENT">Falta (Ausência)</option>
                        <option value="LATE">Atraso</option>
                     </select>
                  </div>
                </div>
                
                <!-- Late Specific Time (Only shows if Atraso is selected) -->
                @if (exceptionEntry.type === 'LATE') {
                  <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-fade-in">
                     <label class="block text-sm font-medium text-yellow-800 mb-1">Hora de Chegada (Real)</label>
                     <input type="time" [(ngModel)]="exceptionEntry.timeIn" name="timeIn" class="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
                  </div>
                }

                <!-- Justification Section -->
                <div class="border-t pt-4 mt-2">
                  <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Justificativa (Opcional)
                  </h4>
                  
                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-600 mb-1">Motivo / Descrição</label>
                      <textarea [(ngModel)]="exceptionEntry.reason" name="reason" rows="2" class="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" placeholder="Ex: Consulta médica, problemas de transporte..."></textarea>
                    </div>
                    
                    <!-- File Upload & Link Section -->
                    <div>
                      <label class="block text-sm font-medium text-gray-600 mb-1">Anexar Comprovativo</label>
                      <div class="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                         
                         <!-- File Button -->
                         <label class="flex items-center gap-3 w-full p-2 bg-white border border-gray-300 border-dashed rounded cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <div class="bg-blue-100 p-2 rounded-full text-blue-600 group-hover:bg-blue-200">
                               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            </div>
                            <div class="flex-1 overflow-hidden">
                               <span class="block text-sm font-medium text-gray-700 truncate">
                                  {{ selectedFileName() || 'Carregar Ficheiro (PDF, JPG, PNG)' }}
                               </span>
                               @if (!selectedFileName()) {
                                 <span class="block text-xs text-gray-400">Clique para selecionar</span>
                               }
                            </div>
                            <!-- Hidden Input -->
                            <input type="file" class="hidden" (change)="onFileSelected($event, 'exception')" accept=".pdf, .jpg, .jpeg, .png">
                         </label>

                         <div class="relative flex items-center py-1">
                            <div class="flex-grow border-t border-gray-300"></div>
                            <span class="flex-shrink-0 mx-2 text-xs text-gray-400 font-bold uppercase">Ou Link Externo</span>
                            <div class="flex-grow border-t border-gray-300"></div>
                         </div>

                         <!-- Optional Link Input -->
                         <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            </span>
                            <input type="text" [(ngModel)]="exceptionEntry.attachmentUrl" name="attachmentUrl" class="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm bg-white" placeholder="https://...">
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t mt-4">
                   <button type="button" (click)="showExceptionModal.set(false)" class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                   <button type="submit" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg">Confirmar Lançamento</button>
                </div>
             </form>
          </div>
        </div>
      }

      <!-- Justification Modal (View Only or Edit) -->
      @if (showJustifyModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-xl shadow-lg p-6 w-full max-w-md animate-fade-in">
            <h3 class="font-bold text-lg mb-4 text-gray-800">Justificar Pendência</h3>
            
            <div class="space-y-4">
              <div>
                 <label class="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                 <textarea [(ngModel)]="justificationReason" class="w-full border rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500" rows="3" placeholder="Descreva o motivo..."></textarea>
              </div>
              
              <div>
                 <label class="block text-sm font-medium text-gray-700 mb-1">Comprovativo</label>
                 <div class="flex flex-col gap-2">
                     <label class="flex items-center justify-center gap-2 w-full p-2 bg-blue-50 border border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <span class="text-sm text-blue-700 font-medium truncate max-w-[200px]">
                           {{ selectedFileName() || 'Upload Ficheiro' }}
                        </span>
                        <input type="file" class="hidden" (change)="onFileSelected($event, 'justification')" accept=".pdf, .jpg, .jpeg, .png">
                     </label>
                     
                     <input type="text" [(ngModel)]="justificationUrl" class="w-full border rounded-lg p-2 text-sm" placeholder="Ou cole um link (Opcional)">
                 </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button (click)="showJustifyModal.set(false)" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button (click)="submitJustification()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow">Enviar</button>
            </div>
          </div>
        </div>
      }

      <!-- Lists -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Daily Log -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex flex-col sm:flex-row justify-between items-center mb-4 border-b pb-2 gap-2">
             <div class="flex items-center gap-4">
               <h3 class="font-bold text-gray-800">Registos de</h3>
               <input 
                 type="date" 
                 [ngModel]="selectedListDate()" 
                 (ngModelChange)="selectedListDate.set($event)"
                 class="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-blue-50 focus:border-blue-500 focus:outline-none font-bold"
               >
             </div>
             <input 
               type="text" 
               [ngModel]="tableSearchQuery()" 
               (ngModelChange)="tableSearchQuery.set($event)"
               placeholder="Pesquisar na lista..." 
               class="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-auto"
             >
          </div>
          <div class="space-y-3">
          <!-- Classic Table Layout -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" class="relative px-6 py-3"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (record of filteredRecords(); track (record.id + record.status + record.isJustified)) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ getEmployeeName(record.employeeId) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (record.status === 'ABSENT') {
                        <span class="text-xs text-red-500 font-bold">Ausente</span>
                      } @else {
                        <div class="text-sm text-gray-900">
                          {{ record.checkIn | date:'HH:mm' }} - {{ record.checkOut | date:'HH:mm' }}
                        </div>
                        @if (record.overtimeHours !== 0) {
                          <div class="text-xs font-bold" [class.text-blue-600]="record.overtimeHours > 0" [class.text-orange-600]="record.overtimeHours < 0">
                            {{ record.overtimeHours > 0 ? '+ ' : '' }}{{ record.overtimeHours }}h Extras
                          </div>
                        }
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getStatusClass(record.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                        {{ record.status }}
                      </span>
                      @if (record.isJustified || hasJustification(record)) {
                        <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Justificado
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      @if ((record.status !== 'PRESENT' || !record.id.toString().startsWith('virtual-')) && auth.hasRole(['ADMIN', 'MANAGER'])) {
                        <button (click)="revertStatus(record)" class="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors">Anular / Reverter</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                      Sem registos para esta data.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
           </div>
        </div>

        <!-- Justifications List -->
        <div class="bg-white rounded-xl shadow-sm p-6">
           <div class="flex justify-between items-center mb-4 border-b pb-2">
             <h3 class="font-bold text-gray-800">Justificações Recentes</h3>
             @if (auth.hasRole(['EMPLOYEE'])) {
                <button (click)="showJustifyModal.set(true)" class="text-sm text-blue-600 underline">Nova Justificação</button>
             }
           </div>
           
           <div class="space-y-3">
             @for (just of pendingJustifications(); track just.id) {
               <div class="p-3 bg-gray-50 rounded-lg border-l-4" [class.border-purple-500]="just.status === 'PENDING'" [class.border-green-500]="just.status === 'APPROVED'">
                 <div class="flex justify-between">
                   <p class="font-bold text-sm">{{ getEmployeeName(just.employeeId) }}</p>
                   <span class="text-xs text-gray-400">{{ just.submissionDate | date:'dd/MM' }}</span>
                 </div>
                 <p class="text-xs text-gray-500 font-medium mb-1">Referente a: {{ just.attendanceDate | date:'dd/MM/yyyy' }}</p>
                 <p class="text-sm text-gray-800 italic">"{{ just.reason }}"</p>
                 
                 @if (just.attachmentUrl) {
                    <!-- Check if it is a Base64 data URI (file) or a regular Link -->
                    @if (just.attachmentUrl.startsWith('data:')) {
                       <button (click)="downloadFile(just.attachmentUrl)" class="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                          Baixar Anexo
                       </button>
                    } @else {
                       <a [href]="just.attachmentUrl" target="_blank" class="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                         <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                         Abrir Link Externo
                       </a>
                    }
                 }

                 @if (auth.hasRole(['ADMIN', 'MANAGER']) && just.status === 'PENDING') {
                   <div class="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                     <button (click)="approveJustification(just)" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold">Aprovar</button>
                     <button (click)="rejectJustification(just)" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-bold">Rejeitar</button>
                   </div>
                 }
               </div>
             } @empty {
               <p class="text-gray-400 text-center py-4">Nenhuma justificação pendente.</p>
             }
           </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceTrackerComponent {
  data = inject(DataService);
  auth = inject(AuthService);

  today = new Date();

  // Exception Entry State
  showExceptionModal = signal(false);
  selectedFileName = signal(''); // For displaying selected file name

  exceptionEntry = {
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'ABSENT' as 'ABSENT' | 'LATE',
    timeIn: '',
    reason: '',
    attachmentUrl: '' // Can be URL or Base64
  };

  selectedListDate = signal(new Date().toISOString().split('T')[0]);

  // Justification Modal State
  showJustifyModal = signal(false);
  justificationReason = '';
  justificationUrl = '';

  // Search Signals
  tableSearchQuery = signal('');
  modalSearchQuery = signal('');

  // Computed Properties for Search
  filteredEmployeesForModal = computed(() => {
    const q = this.modalSearchQuery().toLowerCase();
    const employees = this.data.employees().filter(e => e.status === 'ACTIVE');
    if (!q) return employees;
    return employees.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      (e.employeeNumber && e.employeeNumber.includes(q))
    );
  });

  filteredRecords = computed(() => {
    const q = this.tableSearchQuery().toLowerCase();
    const records = this.recordsForSelectedDate();
    if (!q) return records;
    return records.filter(r => {
      const name = this.getEmployeeName(r.employeeId).toLowerCase();
      // Also search by ID/Status if needed, but name is primary
      return name.includes(q);
    });
  });

  recordsForSelectedDate = computed(() => {
    const dateStr = this.selectedListDate().trim();
    const attendance = this.data.attendance().filter(r => r.date.trim() === dateStr);
    const employees = this.data.employees().filter(e => e.status === 'ACTIVE');

    return employees.map(emp => {
      const existing = attendance.find(r => r.employeeId === emp.id);
      if (existing) return existing;

      // Virtual Present Record (Default)
      // Uses the employee's schedule start as assumed check-in time
      const startTime = (emp.scheduleStart || '08:00').substring(0, 5);
      const endTime = (emp.scheduleEnd || '17:00').substring(0, 5);

      return {
        id: `virtual-${emp.id}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn: `${dateStr}T${startTime}:00`,
        status: 'PRESENT',
        isJustified: false,
        overtimeHours: 0,
        checkOut: `${dateStr}T${endTime}:00`
      } as AttendanceRecord;
    });
  });

  pendingJustifications = computed(() => {
    return this.data.justifications().sort((a, b) => b.submissionDate.localeCompare(a.submissionDate));
  });

  hasJustification(record: AttendanceRecord): boolean {
    return this.data.justifications().some(j =>
      j.employeeId === record.employeeId && j.attendanceDate === record.date
    );
  }

  getEmployeeName(id: string) {
    return this.data.getEmployeeById(id)?.fullName || 'Desconhecido';
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Handle File Selection (Converts to Base64)
  onFileSelected(event: any, context: 'exception' | 'justification') {
    const file = event.target.files[0];
    if (file) {
      // Basic validation (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O ficheiro é demasiado grande. Máximo 5MB.');
        return;
      }

      this.selectedFileName.set(file.name);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const result = e.target.result;
        if (context === 'exception') {
          this.exceptionEntry.attachmentUrl = result;
        } else {
          this.justificationUrl = result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Helper to "download" Base64 file
  downloadFile(dataUrl: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'comprovativo_anexo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openExceptionModal() {
    const now = new Date();
    this.selectedFileName.set('');
    this.exceptionEntry = {
      employeeId: '',
      date: now.toISOString().split('T')[0],
      type: 'ABSENT',
      timeIn: now.toTimeString().substring(0, 5), // HH:mm
      reason: '',
      attachmentUrl: ''
    };
    this.showExceptionModal.set(true);
  }

  async saveExceptionRecord(e: Event) {
    e.preventDefault();
    if (!this.exceptionEntry.employeeId || !this.exceptionEntry.date) return;

    const emp = this.data.getEmployeeById(this.exceptionEntry.employeeId);
    if (!emp) return;

    // Find existing record to avoid duplicates and ensure reflection
    const existing = this.data.attendance().find(a =>
      a.employeeId === this.exceptionEntry.employeeId && a.date === this.exceptionEntry.date
    );

    let checkInIso = undefined;
    let overtimeHours = 0;

    if (this.exceptionEntry.type === 'LATE' && this.exceptionEntry.timeIn) {
      const scheduledStartStr = `${this.exceptionEntry.date}T${emp.scheduleStart || '08:00'}:00`;
      const actualArrivalStr = `${this.exceptionEntry.date}T${this.exceptionEntry.timeIn}:00`;

      const scheduledStart = new Date(scheduledStartStr);
      const actualArrival = new Date(actualArrivalStr);

      checkInIso = actualArrival.toISOString();

      // Calculate lateness in hours
      const diffMs = actualArrival.getTime() - scheduledStart.getTime();
      const lateHours = Math.max(0, diffMs / (1000 * 60 * 60));

      if (lateHours > 0) {
        // Discount from current overtime if exists, or set as negative
        const currentOT = existing?.overtimeHours || 0;
        overtimeHours = currentOT - lateHours;
        console.log(`Lateness detected: ${lateHours.toFixed(2)}h. New OT: ${overtimeHours.toFixed(2)}h`);
      }
    }

    const record: AttendanceRecord = {
      id: existing?.id || `att-${Date.now()}`,
      employeeId: this.exceptionEntry.employeeId,
      date: this.exceptionEntry.date,
      checkIn: checkInIso || existing?.checkIn,
      checkOut: existing?.checkOut, // Preserve checkout if exists
      status: this.exceptionEntry.type,
      isJustified: !!this.exceptionEntry.reason,
      overtimeHours: overtimeHours
    };

    const success = await this.data.logAttendance(record);

    if (success && this.exceptionEntry.reason) {
      const just: Justification = {
        id: `just-${Date.now()}`,
        employeeId: this.exceptionEntry.employeeId,
        attendanceDate: this.exceptionEntry.date,
        reason: this.exceptionEntry.reason,
        attachmentUrl: this.exceptionEntry.attachmentUrl,
        status: 'APPROVED',
        submissionDate: new Date().toISOString(),
        adminComment: 'Lançado administrativamente.'
      };
      await this.data.addJustification(just);
    }

    if (success) {
      this.showExceptionModal.set(false);
    } else {
      alert('Erro ao guardar o registo. Verifique a consola.');
    }
  }

  async submitJustification() {
    const user = this.auth.currentUser();
    const empId = user?.employeeId;

    if (!empId) return;

    const just: Justification = {
      id: `just-${Date.now()}`,
      employeeId: empId,
      attendanceDate: new Date().toISOString().split('T')[0],
      reason: this.justificationReason,
      attachmentUrl: this.justificationUrl,
      status: 'PENDING',
      submissionDate: new Date().toISOString()
    };

    await this.data.addJustification(just);
    this.showJustifyModal.set(false);
    this.justificationReason = '';
    this.justificationUrl = '';
    this.selectedFileName.set('');
  }

  async approveJustification(just: Justification) {
    await this.data.updateJustification({ ...just, status: 'APPROVED' });

    const atts = this.data.attendance().filter(a => a.employeeId === just.employeeId && a.date === just.attendanceDate);
    for (const att of atts) {
      await this.data.logAttendance({ ...att, isJustified: true });
    }
  }

  async rejectJustification(just: Justification) {
    await this.data.updateJustification({ ...just, status: 'REJECTED' });
  }

  async revertStatus(record: AttendanceRecord) {
    if (!confirm('Tem certeza que deseja reverter este registo para PRESENTE? Isso removerá a falta/atraso e quaisquer justificativas associadas.')) return;

    const emp = this.data.getEmployeeById(record.employeeId);
    if (!emp) return;

    const todayStr = record.date;
    const startTime = (emp.scheduleStart || '08:00').substring(0, 5);
    const endTime = (emp.scheduleEnd || '17:00').substring(0, 5);

    const resetRecord: AttendanceRecord = {
      ...record,
      checkIn: `${todayStr}T${startTime}:00`,
      checkOut: `${todayStr}T${endTime}:00`,
      status: 'PRESENT',
      isJustified: false,
      overtimeHours: 0
    };

    const success = await this.data.logAttendance(resetRecord);
    if (success) {
      await this.data.deleteJustificationsForEmployeeOnDate(record.employeeId, record.date);
    } else {
      alert('Erro ao reverter o status. Consulte a consola.');
    }
  }
}