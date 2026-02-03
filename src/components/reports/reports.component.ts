import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <h2 class="text-2xl font-bold text-gray-800">Relatórios</h2>
        <button (click)="print()" class="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Gerar PDF / Imprimir
        </button>
      </div>

      <!-- Filters (Hidden on Print) -->
      <div class="bg-white p-6 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden border border-gray-100">
        <!-- Month Filter -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Período (Mês/Ano)</label>
          <input 
            type="month" 
            [ngModel]="selectedMonth()" 
            (ngModelChange)="selectedMonth.set($event)"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-shadow"
          >
        </div>

        <!-- Department Filter -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Departamento</label>
          <select 
            [ngModel]="selectedDept()" 
            (ngModelChange)="selectedDept.set($event)"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white transition-shadow">
            <option value="">Todos os Departamentos</option>
            @for (dept of data.departments(); track dept.id) {
              <option [value]="dept.name">{{ dept.name }}</option>
            }
          </select>
        </div>

        <!-- Summary Widget -->
        <div class="flex items-end pb-2">
           <div class="text-sm text-gray-500">
             Mostrando dados de <strong class="text-gray-900">{{ reportData().length }}</strong> funcionários.
           </div>
        </div>
      </div>

      <!-- Printable Area -->
      <div id="printable-area" class="bg-white p-8 shadow-lg min-h-[29.7cm] relative print:shadow-none print:w-full">
        
        <!-- Header -->
        <div class="flex justify-between items-center border-b-2 border-yellow-500 pb-4 mb-8">
           <!-- Logo with invert filter for white paper contrast if needed, or normal -->
           <img src="https://redegirassol.com//abuploads/2022/08/site_rede_girassol_branco_footer.png" width="150" height="60" class="object-contain filter invert" alt="Rede Girassol"> 
           
           <div class="text-right">
              <h1 class="text-slate-900 font-bold text-2xl uppercase tracking-wider">Relatório de Presenças</h1>
              <p class="text-yellow-600 font-medium text-sm mt-1 uppercase">{{ getMonthName(selectedMonth()) }}</p>
           </div>
        </div>

        <div class="mb-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
             <p><span class="font-bold text-gray-900">Empresa:</span> Rede Girassol</p>
             <p><span class="font-bold text-gray-900">Departamento:</span> {{ selectedDept() || 'Todos' }}</p>
          </div>
          <div class="text-right">
             <p><span class="font-bold text-gray-900">Emissão:</span> {{ now | date:'dd/MM/yyyy HH:mm' }}</p>
             <p><span class="font-bold text-gray-900">Referência:</span> {{ selectedMonth() }}</p>
          </div>
        </div>

        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-800 uppercase text-xs font-bold tracking-wider border-y-2 border-slate-200">
              <th class="p-3 border-r border-slate-200">Funcionário</th>
              <th class="p-3 border-r border-slate-200">Cargo / Dept</th>
              <th class="p-3 text-center border-r border-slate-200 w-24">Presenças</th>
              <th class="p-3 text-center border-r border-slate-200 w-24">Atrasos</th>
              <th class="p-3 text-center border-r border-slate-200 w-24">Faltas</th>
              <th class="p-3 text-center w-24">H. Extras</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 text-gray-700">
            @for (row of reportData(); track row.id) {
              <tr class="hover:bg-gray-50 break-inside-avoid">
                <td class="p-3 border-r border-gray-100 font-bold">
                  {{ row.name }}
                  <div class="text-[10px] font-normal text-gray-400">{{ row.employeeNumber }}</div>
                </td>
                <td class="p-3 border-r border-gray-100">
                  <div class="font-medium">{{ row.jobTitle }}</div>
                  <div class="text-xs text-gray-500">{{ row.dept }}</div>
                </td>
                <td class="p-3 text-center border-r border-gray-100 font-medium">{{ row.present }}</td>
                <td class="p-3 text-center border-r border-gray-100 font-medium text-yellow-600">{{ row.late }}</td>
                <td class="p-3 text-center border-r border-gray-100 font-bold text-red-600 bg-red-50">{{ row.absent }}</td>
                <td class="p-3 text-center font-medium text-blue-700">{{ row.overtime }}h</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-8 text-center text-gray-400 italic border border-dashed border-gray-300 rounded">
                  Nenhum dado encontrado para este período ou departamento.
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Stats Summary -->
        <div class="mt-8 grid grid-cols-4 gap-4 border-t pt-4">
           <div class="bg-gray-50 p-4 rounded text-center">
             <span class="block text-xs text-gray-500 uppercase">Total Presenças</span>
             <span class="block text-xl font-bold text-gray-800">{{ totalStats().present }}</span>
           </div>
           <div class="bg-yellow-50 p-4 rounded text-center">
             <span class="block text-xs text-yellow-700 uppercase">Total Atrasos</span>
             <span class="block text-xl font-bold text-yellow-700">{{ totalStats().late }}</span>
           </div>
           <div class="bg-red-50 p-4 rounded text-center">
             <span class="block text-xs text-red-700 uppercase">Total Faltas</span>
             <span class="block text-xl font-bold text-red-700">{{ totalStats().absent }}</span>
           </div>
           <div class="bg-blue-50 p-4 rounded text-center">
             <span class="block text-xs text-blue-700 uppercase">Total Horas Extras</span>
             <span class="block text-xl font-bold text-blue-700">{{ totalStats().overtime }}h</span>
           </div>
        </div>

        <!-- Footer -->
        <div class="mt-16 flex justify-between items-end text-xs text-gray-500">
           <div class="text-center">
             <div class="h-px bg-gray-400 w-48 mb-2"></div>
             <p class="uppercase font-bold text-gray-700">Responsável RH</p>
           </div>
           <div class="text-right">
             <p class="font-bold text-slate-900">Rede Girassol</p>
             <p>Sistema Integrado de Gestão de Recursos Humanos</p>
           </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  data = inject(DataService);
  
  now = new Date();
  
  // Filters
  selectedMonth = signal(new Date().toISOString().slice(0, 7)); // Defaults to Current Month YYYY-MM
  selectedDept = signal(''); // Empty = All

  reportData = computed(() => {
    const month = this.selectedMonth(); // '2024-02'
    const deptName = this.selectedDept();
    
    // 1. Filter Employees by Dept
    let employees = this.data.employees();
    if (deptName) {
      employees = employees.filter(e => e.department === deptName);
    }

    // 2. Get All Attendance for specific month
    // Attendance date format is YYYY-MM-DD
    const relevantAttendance = this.data.attendance().filter(r => r.date.startsWith(month));

    // 3. Map Data
    return employees.map(emp => {
      const empAtt = relevantAttendance.filter(a => a.employeeId === emp.id);
      
      return {
        id: emp.id,
        employeeNumber: emp.employeeNumber,
        name: emp.fullName,
        jobTitle: emp.jobTitle,
        dept: emp.department,
        present: empAtt.filter(a => a.status === 'PRESENT').length,
        late: empAtt.filter(a => a.status === 'LATE').length,
        absent: empAtt.filter(a => a.status === 'ABSENT').length,
        overtime: empAtt.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  });

  totalStats = computed(() => {
    const data = this.reportData();
    return {
      present: data.reduce((acc, curr) => acc + curr.present, 0),
      late: data.reduce((acc, curr) => acc + curr.late, 0),
      absent: data.reduce((acc, curr) => acc + curr.absent, 0),
      overtime: data.reduce((acc, curr) => acc + curr.overtime, 0)
    };
  });

  getMonthName(isoMonth: string): string {
    if (!isoMonth) return '';
    const [year, month] = isoMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  }

  print() {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;

    const windowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    if (!windowPrt) return;

    windowPrt.document.write(`
      <html>
        <head>
          <title>Relatório RH - ${this.selectedMonth()}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              background-color: white;
            }
            @page { 
              size: A4; 
              margin: 1cm; 
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            tr { break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="p-8">
            ${printContent.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 800);
          </script>
        </body>
      </html>
    `);

    windowPrt.document.close();
    windowPrt.focus();
  }
}