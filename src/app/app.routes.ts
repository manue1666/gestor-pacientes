import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { PacientesComponent } from './components/pacientes/pacientes';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'pacientes', 
    component: PacientesComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];