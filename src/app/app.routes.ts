// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ========== PUBLIC AUTH ROUTES ==========
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'verify-2fa',
        loadComponent: () =>
          import('./pages/two-factor-auth/two-factor-auth.component').then(
            (m) => m.TwoFactorAuthComponent
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
      },
      {
        path: 'verify-reset-code',
        loadComponent: () =>
          import('./pages/verify-reset-code/verify-reset-code.component').then(
            (m) => m.VerifyResetCodeComponent
          ),
      },
      {
        path: 'new-password',
        loadComponent: () =>
          import('./pages/new-password/new-password.component').then(
            (m) => m.NewPasswordComponent
          ),
      },
    ],
  },

  // ========== CLOCK PAGE (ISOLÉE - PAS DE LAYOUT) ==========
  {
    path: 'clock',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/clock/clock.component').then((m) => m.ClockComponent),
  },

  // ========== PROTECTED ROUTES (AVEC LAYOUT) ==========
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./pages/teams/teams.component').then((m) => m.TeamsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
