import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth-guard';
import { guestGuard } from './core/auth/guards/guest-guard';
import { inviteGuard } from './core/auth/guards/invite-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
   {
        path: 'register',
        canActivate: [inviteGuard],
        loadComponent: () =>
          import('./layouts/register/register').then((m) => m.Register),
        title: 'Register page',
      },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth/auth-layouts/auth-layouts.component').then((m) => m.AuthLayoutsComponent),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./feature/auth/login/login.component').then((m) => m.LoginComponent),
        title: 'Login page',
      },
      
      {
        path: 'forget',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./feature/auth/forget/forget.component').then((m) => m.ForgetComponent),
        title: 'Forget page',
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/super-admin/supadmin/supadmin').then((m) => m.Supadmin),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./feature/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'dashboard page',
      },
      {
        path: 'leads',
        loadComponent: () => import('./feature/dashboard/leads/leads').then((m) => m.Leads),
        title: 'Lead page',
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./feature/dashboard/properties/properties').then((m) => m.Properties),
        title: 'properties page',
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./feature/dashboard/customers/customers').then((m) => m.Customers),
        title: 'customers page',
      },
      {
        path: 'tasks',
        loadComponent: () => import('./feature/dashboard/tasks/tasks').then((m) => m.Tasks),
        title: 'task page',
      },
      {
        path: 'reports',
        loadComponent: () => import('./feature/dashboard/reports/reports').then((m) => m.Reports),
        title: 'reports page',
      },
      {
        path: 'Teams',
        loadComponent: () => import('./feature/dashboard/team/team').then((m) => m.Team),
        title: 'Team page',
      },
      {
        path: 'deals',
        loadComponent: () => import('./feature/dashboard/deals/deals').then((m) => m.Deals),
        title: 'deals page',
      }, {
        path: 'company',
        loadComponent: () => import('./feature/dashboard/developercompany/developercompany').then((m) => m.Developercompany),
        title: 'Developercompany page',
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];