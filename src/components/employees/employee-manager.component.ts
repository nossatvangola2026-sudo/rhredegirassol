import { Component, inject, signal, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Employee } from '../../services/data.types';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-manager',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Gestão de Funcionários</h2>
        <button (click)="openModal()" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Novo Funcionário
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-xl shadow-sm flex gap-4">
         <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input 
              type="text" 
              [ngModel]="searchTerm()" 
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Pesquisar por nome ou cargo..." 
              class="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            >
         </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table class="w-full text-left text-sm text-gray-600">
          <thead class="bg-gray-50 text-gray-900 font-bold uppercase text-xs tracking-wider border-b">
            <tr>
              <th class="px-6 py-4">ID</th>
              <th class="px-6 py-4">Nome</th>
              <th class="px-6 py-4">Cargo</th>
              <th class="px-6 py-4">Departamento</th>
              <th class="px-6 py-4">Horário</th>
              <th class="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (emp of filteredEmployees(); track emp.id) {
              <tr class="hover:bg-gray-50 transition-colors" [class.bg-gray-50]="emp.status === 'INACTIVE'" [class.opacity-75]="emp.status === 'INACTIVE'">
                <td class="px-6 py-4 font-mono text-xs font-semibold text-gray-500">{{ emp.employeeNumber }}</td>
                <td class="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                  {{ emp.fullName }}
                  @if(emp.status === 'INACTIVE') {
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600">INATIVO</span>
                  }
                </td>
                <td class="px-6 py-4">{{ emp.jobTitle }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{{ emp.department }}</span>
                </td>
                <td class="px-6 py-4 text-xs font-mono">{{ emp.scheduleStart }} - {{ emp.scheduleEnd }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-3">
                    <button (click)="editEmployee(emp)" title="Editar" class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    
                    <button (click)="toggleStatus(emp)" [title]="emp.status === 'ACTIVE' ? 'Inativar' : 'Ativar'" class="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 p-1.5 rounded transition-colors">
                      @if (emp.status === 'ACTIVE') {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      }
                    </button>
                    
                    <button (click)="initiateDelete(emp)" title="Excluir" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-400 italic">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Edit/Create Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
            <div class="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 class="text-white font-bold text-lg">{{ isEditing() ? 'Editar' : 'Novo' }} Funcionário</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form (submit)="saveEmployee($event)" class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" [(ngModel)]="currentEmp.fullName" name="fullName" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nº Funcionário</label>
                <input type="text" [(ngModel)]="currentEmp.employeeNumber" name="employeeNumber" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" [(ngModel)]="currentEmp.jobTitle" name="jobTitle" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select [(ngModel)]="currentEmp.department" name="department" class="w-full px-3 py-2 border rounded-lg bg-white focus:ring-yellow-500 focus:border-yellow-500" required>
                  <option [ngValue]="undefined" disabled>Selecione...</option>
                  @for (dept of data.departments(); track dept.id) {
                    <option [value]="dept.name">{{ dept.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" [(ngModel)]="currentEmp.email" name="email" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Data Admissão</label>
                <input type="date" [(ngModel)]="currentEmp.admissionDate" name="admissionDate" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Início Turno</label>
                <input type="time" [(ngModel)]="currentEmp.scheduleStart" name="scheduleStart" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fim Turno</label>
                <input type="time" [(ngModel)]="currentEmp.scheduleEnd" name="scheduleEnd" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              </div>

              <div class="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" (click)="closeModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium text-gray-700">Cancelar</button>
                <button type="submit" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-md transition-transform transform active:scale-95">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal() && employeeToDelete()) {
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100">
             <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
               <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
             </div>
             <h3 class="text-lg font-bold text-gray-900 mb-2">Excluir Funcionário?</h3>
             <p class="text-sm text-gray-500 mb-6">
               Tem certeza que deseja remover <strong>{{ employeeToDelete()?.fullName }}</strong>? <br>
               Esta ação removerá o registo permanentemente e não pode ser desfeita.
             </p>
             <div class="flex gap-3 justify-center">
                <button (click)="cancelDelete()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button (click)="confirmDelete()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Sim, Excluir
                </button>
             </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EmployeeManagerComponent {
  data = inject(DataService);

  searchTerm = signal('');
  showModal = signal(false);
  isEditing = signal(false);

  // Delete Modal State
  showDeleteModal = signal(false);
  employeeToDelete = signal<Employee | null>(null);

  currentEmp: Partial<Employee> = {};

  // Computed filter for reactivity
  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.data.employees().filter(e =>
      e.fullName.toLowerCase().includes(term) ||
      e.jobTitle.toLowerCase().includes(term)
    );
  });

  openModal() {
    this.currentEmp = {
      status: 'ACTIVE',
      contractType: 'Determinado',
      scheduleStart: '08:00',
      scheduleEnd: '17:00'
    };
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  editEmployee(emp: Employee) {
    this.currentEmp = { ...emp };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  async toggleStatus(emp: Employee) {
    const newStatus: 'ACTIVE' | 'INACTIVE' = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updatedEmp: Employee = { ...emp, status: newStatus };
    await this.data.updateEmployee(updatedEmp);
  }

  // Delete Actions
  initiateDelete(emp: Employee) {
    this.employeeToDelete.set(emp);
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.employeeToDelete.set(null);
  }

  async confirmDelete() {
    const emp = this.employeeToDelete();
    if (emp) {
      await this.data.deleteEmployee(emp.id);
      this.cancelDelete();
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveEmployee(e: Event) {
    e.preventDefault();
    let success = false;

    if (this.isEditing() && this.currentEmp.id) {
      success = await this.data.updateEmployee(this.currentEmp as Employee);
    } else {
      // Remove any temporary ID, Postgres will generate a proper one
      const { id, ...empData } = this.currentEmp as any;
      success = await this.data.addEmployee(empData as Employee);
    }

    if (success) {
      this.closeModal();
    } else {
      alert('Erro ao salvar funcionário. Verifique o console para mais detalhes.');
    }
  }
}