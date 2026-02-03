import { Routes, Router } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeeManagerComponent } from './components/employees/employee-manager.component';
import { DepartmentManagerComponent } from './components/departments/department-manager.component';
import { DataImportComponent } from './components/import/data-import.component';
import { AttendanceTrackerComponent } from './components/attendance/attendance-tracker.component';
import { ReportsComponent } from './components/reports/reports.component';
import { DeveloperSettingsComponent } from './components/settings/developer-settings.component'; // New Import
import { LayoutComponent } from './components/layout/layout.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router: Router = inject(Router);
  
  if (auth.isAuthenticated()) {
    return true;
  }
  
  // Redirect to login if not authenticated
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'employees', component: EmployeeManagerComponent },
      { path: 'departments', component: DepartmentManagerComponent },
      { path: 'import', component: DataImportComponent },
      { path: 'attendance', component: AttendanceTrackerComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: DeveloperSettingsComponent } // New Route
    ]
  },
  { path: '**', redirectTo: 'login' }
];