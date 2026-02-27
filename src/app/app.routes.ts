import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { PacientesComponent } from './components/pacientes/pacientes';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'pacientes',
    component: PacientesComponent
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
