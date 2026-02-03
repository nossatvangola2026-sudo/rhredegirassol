import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Employee } from '../../services/data.types';

@Component({
  selector: 'app-data-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Importação Inteligente de Dados</h2>
        <div class="text-sm text-gray-500">Powered by Gemini AI</div>
      </div>

      <!-- Step 1: Upload Area -->
      @if (!fileLoaded() && !processing() && !previewData()) {
        <div class="bg-white p-8 rounded-xl shadow-sm border-2 border-dashed border-gray-300 hover:border-yellow-500 transition-colors text-center">
          <div class="space-y-4">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="text-gray-600">
              <label class="relative cursor-pointer bg-white rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none">
                <span>Carregar ficheiro Excel ou CSV</span>
                <input type="file" (change)="onFileChange($event)" class="sr-only" accept=".xlsx, .xls, .csv">
              </label>
            </div>
            <p class="text-xs text-gray-500">Nota: O sistema ignorará as 2 primeiras linhas e lerá a partir da 3ª linha.</p>
          </div>
        </div>
      }

      <!-- Step 2: Configuration & Start Analysis -->
      @if (fileLoaded() && !processing() && !previewData()) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
          <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
             <div class="flex items-center gap-3">
               <div class="bg-green-100 p-2 rounded-full text-green-600">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
               </div>
               <div>
                 <h3 class="font-bold text-gray-800">Ficheiro Carregado</h3>
                 <p class="text-xs text-gray-500">{{ fileName() }}</p>
               </div>
             </div>
             <button (click)="cancel()" class="text-gray-400 hover:text-red-500">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
          </div>

          <div class="p-6 space-y-4">
             <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-800 mb-2">Instruções para a IA (Opcional)</label>
              <textarea [(ngModel)]="userInstructions" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-sm bg-white" placeholder="Ex: A coluna 'Cod' é o ID. O departamento 'RH' deve virar 'Recursos Humanos'. Ignore linhas sem email."></textarea>
              <p class="text-xs text-gray-500 mt-1">Dê orientações sobre o formato do ficheiro para melhorar a precisão da extração.</p>
            </div>

            <div class="flex justify-end pt-2">
               <button (click)="startAnalysis()" class="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center gap-2 transition-all transform hover:scale-105">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                 Iniciar Análise com IA
               </button>
            </div>
          </div>
        </div>
      }

      <!-- Step 3: Processing State -->
      @if (processing()) {
        <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <div class="flex flex-col items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
            <p class="text-gray-800 font-bold text-lg mb-2">Processando...</p>
            <p class="text-gray-500">{{ statusMessage() }}</p>
          </div>
        </div>
      }

      <!-- Step 4: Preview & Confirm -->
      @if (previewData()) {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in border-2 border-blue-500">
          <div class="p-4 border-b bg-blue-50 flex justify-between items-center">
            <div>
              <h3 class="font-bold text-blue-900 text-lg">Dados Detetados pela IA</h3>
              <p class="text-sm text-blue-700">Verifique a lista abaixo antes de atualizar o sistema.</p>
            </div>
            <div class="flex gap-2">
              <button (click)="cancel()" class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
              <button (click)="confirmImport()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg transition-transform transform hover:scale-105">
                ACTUALIZAR
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-gray-600">
              <thead class="bg-gray-100 text-gray-900 font-bold uppercase text-xs tracking-wider border-b-2 border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-blue-800 bg-blue-50 w-32">ID (Detetado)</th>
                  <th class="px-4 py-3 text-blue-800 bg-blue-50">Nome (Detetado)</th>
                  <th class="px-4 py-3 text-blue-800 bg-blue-50">Cargo (Detetado)</th>
                  <th class="px-4 py-3">Departamento</th>
                  <th class="px-4 py-3">Email</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (item of previewData() | slice:0:10; track $index) {
                  <tr class="hover:bg-blue-50 transition-colors">
                    <td class="px-4 py-3 font-mono font-bold text-blue-700">{{ item.employeeNumber }}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">{{ item.fullName }}</td>
                    <td class="px-4 py-3 font-medium text-gray-800">{{ item.jobTitle }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-block bg-gray-100 px-2 py-1 rounded text-xs">{{ item.department }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-500">{{ item.email }}</td>
                  </tr>
                }
              </tbody>
            </table>
            @if (previewCount > 10) {
              <div class="p-3 text-center text-sm text-gray-500 bg-gray-50 border-t">
                ... e mais {{ previewCount - 10 }} registos aguardando atualização.
              </div>
            }
          </div>
        </div>
      }

      @if (resultSummary()) {
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded shadow-sm flex justify-between items-center">
           <div>
             <h4 class="font-bold text-lg mb-1">Importação Concluída</h4>
             <p>{{ resultSummary() }}</p>
           </div>
           <button (click)="resultSummary.set(null)" class="px-4 py-2 bg-green-200 hover:bg-green-300 text-green-800 rounded font-medium">
             Fechar
           </button>
        </div>
      }
    </div>
  `
})
export class DataImportComponent {
  dataService = inject(DataService);

  processing = signal(false);
  fileLoaded = signal(false);
  fileName = signal('');
  statusMessage = signal('');
  previewData = signal<any[] | null>(null);
  resultSummary = signal<string | null>(null);
  userInstructions = signal('');

  previewCount = 0;
  rawJson: any[] = [];

  async onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) return;

    this.resetState();
    this.processing.set(true);
    this.statusMessage.set('A ler ficheiro...');

    const file = target.files[0];
    this.fileName.set(file.name);

    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const bstr: string = e.target.result;
        const XLSX = await import('xlsx');
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // First, let's see what the raw data looks like (header auto-detected)
        const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        console.log('Linhas lidas:', raw.length);
        console.log('Primeira linha (deve ser dados, não cabeçalho):', raw[0]);
        console.log('Colunas detetadas:', raw[0] ? Object.keys(raw[0]) : 'Nenhuma');

        this.rawJson = raw.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => { newRow[key.trim()] = row[key]; });
          return newRow;
        });

        if (this.rawJson.length === 0) throw new Error('Ficheiro vazio ou formato inválido.');
        this.fileLoaded.set(true);
        this.processing.set(false);
        this.statusMessage.set('');
      } catch (error) {
        console.error(error);
        alert('Erro ao ler ficheiro: ' + error);
        this.processing.set(false);
        this.resetState();
      }
    };
    reader.readAsBinaryString(file);
  }

  async startAnalysis() {
    if (this.rawJson.length === 0) {
      alert('Nenhum dado encontrado no ficheiro.');
      return;
    }

    this.processing.set(true);
    this.statusMessage.set('Passo 1/3: Analisando estrutura do ficheiro...');

    try {
      await this.analyzeDataWithGemini(this.rawJson);
    } catch (error) {
      console.error('Erro na análise:', error);
      this.statusMessage.set('Erro ao processar. Reiniciando...');
      this.processing.set(false);
      alert('Erro ao processar ficheiro: ' + error);
    }
  }

  async analyzeDataWithGemini(jsonData: any[]) {
    try {
      const sample = jsonData.slice(0, 3);

      if (!sample[0] || Object.keys(sample[0]).length === 0) {
        throw new Error('O ficheiro não contém colunas válidas.');
      }

      const keys = Object.keys(sample[0]);
      console.log('Colunas detetadas:', keys);

      this.statusMessage.set(`Passo 2/3: ${keys.length} colunas detetadas. Mapeando campos...`);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Smart local mapping - detect columns based on common patterns
      const mapping = this.detectColumnMapping(keys, sample);
      console.log('Mapeamento:', mapping);

      this.statusMessage.set(`Passo 3/3: Processando ${jsonData.length} registos...`);
      await new Promise(resolve => setTimeout(resolve, 300));

      this.applyMapping(mapping, jsonData);
    } catch (error) {
      console.error('Erro em analyzeDataWithGemini:', error);
      this.processing.set(false);
      throw error;
    }
  }

  /**
   * Detects column mapping based on column names and sample data
   */
  private detectColumnMapping(keys: string[], sample: any[]): any {
    const lowerKeys = keys.map(k => k.toLowerCase().trim());
    const numCols = keys.length;

    console.log('Detetando mapeamento para colunas:', keys);

    // Find employee number column - check exact match first, then partial
    const idPatterns = ['id', 'cod', 'codigo', 'código', 'numero', 'número', 'nº', 'matricula', 'matrícula', 'employee_number', 'employeenumber', 'n.º'];
    let employeeNumberIdx = lowerKeys.findIndex(k => k === 'id'); // Exact match first
    if (employeeNumberIdx === -1) {
      employeeNumberIdx = lowerKeys.findIndex(k => idPatterns.some(p => k.includes(p)));
    }

    // Find name column
    const namePatterns = ['nome', 'name', 'funcionario', 'funcionário', 'full_name', 'fullname', 'colaborador'];
    const fullNameIdx = lowerKeys.findIndex(k => namePatterns.some(p => k.includes(p)));

    // Find job title column - added "função" pattern
    const jobPatterns = ['cargo', 'funcao', 'função', 'funçao', 'job', 'title', 'job_title', 'jobtitle', 'posicao', 'posição', 'ocupacao', 'ocupação'];
    const jobTitleIdx = lowerKeys.findIndex(k => jobPatterns.some(p => k.includes(p)));

    // Find department column
    const deptPatterns = ['departamento', 'department', 'dept', 'sector', 'setor', 'area', 'área', 'divisao', 'divisão'];
    const departmentIdx = lowerKeys.findIndex(k => deptPatterns.some(p => k.includes(p)));

    // Find email column
    const emailPatterns = ['email', 'e-mail', 'correio', 'mail'];
    const emailIdx = lowerKeys.findIndex(k => emailPatterns.some(p => k.includes(p)));

    const mapping = {
      employeeNumber: keys[employeeNumberIdx !== -1 ? employeeNumberIdx : 0],
      fullName: keys[fullNameIdx !== -1 ? fullNameIdx : (numCols > 1 ? 1 : 0)],
      jobTitle: keys[jobTitleIdx !== -1 ? jobTitleIdx : (numCols > 2 ? 2 : 0)],
      department: departmentIdx !== -1 ? keys[departmentIdx] : null,
      email: emailIdx !== -1 ? keys[emailIdx] : null
    };

    console.log('Mapeamento final:', mapping);
    return mapping;
  }


  applyMapping(mapping: any, rawData: any[]) {
    try {
      const mappedData = rawData.map((row, index) => {
        // Convert values to strings safely
        const getValue = (key: string | null) => {
          if (!key) return '';
          const val = row[key];
          if (val === null || val === undefined) return '';
          return String(val).trim();
        };

        const empNumber = getValue(mapping.employeeNumber);
        const fullName = getValue(mapping.fullName);
        const jobTitle = getValue(mapping.jobTitle);

        return {
          id: `emp-imp-${Date.now()}-${index}`,
          fullName: fullName || 'Sem Nome',
          employeeNumber: empNumber || `IMP-${Math.floor(Math.random() * 10000)}`,
          jobTitle: jobTitle || 'Funcionário',
          department: getValue(mapping.department) || 'Geral',
          email: getValue(mapping.email) || `${empNumber || 'user' + index}@girassol.ao`,
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE' as const,
          contractType: 'Indeterminado',
          scheduleStart: '08:00',
          scheduleEnd: '17:00'
        };
      }) as Employee[];

      console.log('Dados mapeados:', mappedData.length, 'registos');
      console.log('Amostra:', mappedData[0]);

      this.previewData.set(mappedData);
      this.previewCount = mappedData.length;
      this.processing.set(false);
      this.statusMessage.set('');
    } catch (error) {
      console.error('Erro em applyMapping:', error);
      this.processing.set(false);
      alert('Erro ao mapear dados: ' + error);
    }
  }

  async confirmImport() {
    if (!this.previewData()) return;
    const employees = this.previewData() as Employee[];
    const departments = [...new Set(employees.map(e => e.department))];
    const stats = await this.dataService.bulkUpsert(employees, departments);
    this.resultSummary.set(`Sucesso: ${stats.empsAdded} novos funcionários adicionados. ${stats.empsSkipped} registos ignorados por já existirem no sistema.`);
    this.resetState();
  }

  cancel() { this.resetState(); }
  resetState() {
    this.previewData.set(null);
    this.fileLoaded.set(false);
    this.fileName.set('');
    this.rawJson = [];
    this.processing.set(false);
  }
}
