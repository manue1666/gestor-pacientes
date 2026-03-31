import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { PacientesComponent } from './components/pacientes/pacientes';
import { authGuard } from './guards/auth-guard';
import { QueryAuthComponent } from './components/query-auth/query-auth';
import { QueryHomeComponent } from './components/query-home/query-home';
import { QueryBuilderGuard } from './guards/query-builder-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'pacientes', 
    component: PacientesComponent,
    canActivate: [authGuard]
  },
  // Rutas de Query Builder
  { path: 'query-auth', component: QueryAuthComponent },
  { 
    path: 'query-home', 
    component: QueryHomeComponent,
    canActivate: [QueryBuilderGuard]
  },
  { path: '**', redirectTo: '/login' }
];