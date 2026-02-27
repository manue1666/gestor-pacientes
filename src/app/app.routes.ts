import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { App } from './app';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'pacientes',
    component: App
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
