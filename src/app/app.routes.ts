import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'measurements',
        loadComponent: () =>
          import('./features/measurements/measurements.component').then(m => m.MeasurementsComponent),
      },
      {
        path: 'buildings',
        loadComponent: () =>
          import('./features/buildings/buildings.component').then(m => m.BuildingsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'cycles',
        loadComponent: () =>
          import('./features/cycles/cycles.component').then(m => m.CyclesComponent),
      },
      {
        path: 'qr-management',
        loadComponent: () =>
          import('./features/qr-management/qr-management.component').then(m => m.QrManagementComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
