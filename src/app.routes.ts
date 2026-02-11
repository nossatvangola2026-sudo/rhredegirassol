import { Routes, Router } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeeManagerComponent } from './components/employees/employee-manager.component';
import { DepartmentManagerComponent } from './components/departments/department-manager.component';
import { DataImportComponent } from './components/import/data-import.component';
import { AttendanceTrackerComponent } from './components/attendance/attendance-tracker.component';
import { ReportsComponent } from './components/reports/reports.component';
import { DeveloperSettingsComponent } from './components/settings/developer-settings.component';
import { UserManagerComponent } from './components/users/user-manager.component';
import { LayoutComponent } from './components/layout/layout.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router: Router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const auth = inject(AuthService);
    const router: Router = inject(Router);
    const user = auth.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
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
      { path: 'employees', component: EmployeeManagerComponent, canActivate: [roleGuard(['ADMIN', 'MANAGER'])] },
      { path: 'departments', component: DepartmentManagerComponent, canActivate: [roleGuard(['ADMIN', 'MANAGER'])] },
      { path: 'import', component: DataImportComponent, canActivate: [roleGuard(['ADMIN', 'MANAGER'])] },
      { path: 'attendance', component: AttendanceTrackerComponent, canActivate: [roleGuard(['ADMIN', 'MANAGER', 'COORDENADOR'])] },
      { path: 'reports', component: ReportsComponent, canActivate: [roleGuard(['ADMIN', 'MANAGER', 'COORDENADOR'])] },
      { path: 'users', component: UserManagerComponent, canActivate: [roleGuard(['ADMIN'])] },
      { path: 'settings', component: DeveloperSettingsComponent, canActivate: [roleGuard(['ADMIN', 'MANAGER'])] }
    ]
  },
  { path: '**', redirectTo: 'login' }
];