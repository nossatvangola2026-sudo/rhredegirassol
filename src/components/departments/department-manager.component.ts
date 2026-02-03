import { Component, inject, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Department } from '../../services/data.types';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-department-manager',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="no-print space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Gestão de Departamentos</h2>
        <button (click)="openModal()" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-transform active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Novo Departamento
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table class="w-full text-left text-sm text-gray-600">
          <thead class="bg-gray-50 text-gray-900 font-bold uppercase text-xs tracking-wider border-b">
            <tr>
              <th class="px-6 py-4">Nome</th>
              <th class="px-6 py-4">Descrição</th>
              <th class="px-6 py-4 text-center">Funcionários</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (dept of data.departments(); track dept.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-900">{{ dept.name }}</td>
                <td class="px-6 py-4">{{ dept.description || '-' }}</td>
                <td class="px-6 py-4 text-center">
                  <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {{ countEmployees(dept.name) }}
                  </span>
                </td>
                <td class="px-6 py-4 flex gap-3 justify-end items-center">
                  <button (click)="viewDepartmentEmployees(dept)" class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline">
                    Visualizar
                  </button>
                  <span class="text-gray-300">|</span>
                  <button (click)="editDepartment(dept)" class="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1 hover:underline">
                    Editar
                  </button>
                  <span class="text-gray-300">|</span>
                  <button (click)="initiateDelete(dept)" class="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-400 italic">
                  Nenhum departamento cadastrado.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div class="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 class="text-white font-bold text-lg">{{ isEditing() ? 'Editar' : 'Novo' }} Departamento</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form (submit)="saveDepartment($event)" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Departamento</label>
                <input type="text" [(ngModel)]="currentDept.name" name="name" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required placeholder="Ex: Financeiro">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea [(ngModel)]="currentDept.description" name="description" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" placeholder="Breve descrição da área..."></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" (click)="closeModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700">Cancelar</button>
                <button type="submit" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal() && deptToDelete()) {
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100">
             <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
               <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
             </div>
             <h3 class="text-lg font-bold text-gray-900 mb-2">Excluir Departamento?</h3>
             
             <div class="text-sm text-gray-500 mb-6">
                <p>Tem certeza que deseja remover <strong>{{ deptToDelete()?.name }}</strong>?</p>
                
                @if (countEmployees(deptToDelete()?.name || '') > 0) {
                  <div class="mt-3 bg-red-50 text-red-700 p-2 rounded text-xs font-bold border border-red-100">
                    Atenção: Existem {{ countEmployees(deptToDelete()?.name || '') }} funcionário(s) vinculados a este departamento.
                  </div>
                }
             </div>

             <div class="flex gap-3 justify-center">
                <button (click)="cancelDelete()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button (click)="confirmDelete()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                  Sim, Excluir
                </button>
             </div>
          </div>
        </div>
      }

      <!-- View Employees Modal -->
      @if (showViewModal() && selectedDeptEmployees().length > 0) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div class="bg-blue-900 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 class="text-white font-bold text-lg">Funcionários: {{ currentDept.name }}</h3>
              <div class="flex items-center gap-3">
                <button (click)="printList()" class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors border border-white/20">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  Imprimir Lista
                </button>
                <button (click)="closeViewModal()" class="text-gray-300 hover:text-white">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              <table class="w-full text-left text-sm text-gray-600 border rounded-lg">
                <thead class="bg-gray-50 text-gray-900 font-bold border-b">
                  <tr>
                    <th class="px-4 py-3">Nº Emp</th>
                    <th class="px-4 py-3">Nome Completo</th>
                    <th class="px-4 py-3">Cargo</th>
                    <th class="px-4 py-3">Contrato</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (emp of selectedDeptEmployees(); track emp.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-3 font-mono text-xs">{{ emp.employeeNumber }}</td>
                      <td class="px-4 py-3 font-medium text-gray-900">{{ emp.fullName }}</td>
                      <td class="px-4 py-3">{{ emp.jobTitle }}</td>
                      <td class="px-4 py-3">{{ emp.contractType }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="px-6 py-4 bg-gray-50 border-t flex justify-end shrink-0">
               <button (click)="closeViewModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-200 text-gray-700 bg-white shadow-sm transition-all border-gray-300">Fechar</button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Print View (Hidden from Screen) -->
    <div class="hidden print-only p-8 bg-white" id="print-area">
      <div class="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ data.systemConfig().appName }}</h1>
          <p class="text-gray-600 mt-1">Lista de Funcionários por Departamento</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold">{{ currentDept.name }}</p>
          <p class="text-sm text-gray-500">Data de Emissão: {{ today }}</p>
        </div>
      </div>

      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-gray-100 border-t-2 border-b-2 border-gray-800">
            <th class="px-4 py-3 text-left">Nº</th>
            <th class="px-4 py-3 text-left">Nome Completo</th>
            <th class="px-4 py-3 text-left">Cargo</th>
            <th class="px-4 py-3 text-left">Tipo de Contrato</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-300">
          @for (emp of selectedDeptEmployees(); track emp.id) {
            <tr>
              <td class="px-4 py-3">{{ emp.employeeNumber }}</td>
              <td class="px-4 py-3 font-bold">{{ emp.fullName }}</td>
              <td class="px-4 py-3">{{ emp.jobTitle }}</td>
              <td class="px-4 py-3">{{ emp.contractType }}</td>
            </tr>
          }
        </tbody>
      </table>

      <div class="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
        Este documento é para uso interno da {{ data.systemConfig().appName }}.
      </div>
    </div>
  `
})
export class DepartmentManagerComponent {
  data = inject(DataService);

  showModal = signal(false);
  isEditing = signal(false);
  showViewModal = signal(false);

  // Delete Modal State
  showDeleteModal = signal(false);
  deptToDelete = signal<Department | null>(null);

  currentDept: Partial<Department> = {};

  today = new Date().toLocaleDateString('pt-PT');

  selectedDeptEmployees = signal<any[]>([]);

  countEmployees(deptName: string): number {
    return this.data.employees().filter(e => e.department === deptName).length;
  }

  openModal() {
    this.currentDept = {};
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  editDepartment(dept: Department) {
    this.currentDept = { ...dept };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  viewDepartmentEmployees(dept: Department) {
    this.currentDept = { ...dept };
    const emps = this.data.employees().filter(e => e.department === dept.name);
    this.selectedDeptEmployees.set(emps);
    if (emps.length > 0) {
      this.showViewModal.set(true);
    } else {
      alert('Nenhum funcionário encontrado neste departamento.');
    }
  }

  closeViewModal() {
    this.showViewModal.set(false);
  }

  printList() {
    window.print();
  }

  async saveDepartment(e: Event) {
    e.preventDefault();

    if (this.isEditing() && this.currentDept.id) {
      await this.data.updateDepartment(this.currentDept as Department);
    } else {
      const newDept: Department = {
        name: this.currentDept.name || 'Novo Dept',
        description: this.currentDept.description || '',
        id: 'dept-' + Date.now(),
      };
      await this.data.addDepartment(newDept);
    }
    this.closeModal();
  }

  // New Delete Flow
  initiateDelete(dept: Department) {
    this.deptToDelete.set(dept);
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deptToDelete.set(null);
  }

  async confirmDelete() {
    const dept = this.deptToDelete();
    if (dept) {
      await this.data.deleteDepartment(dept.id);
      this.cancelDelete();
    }
  }
}