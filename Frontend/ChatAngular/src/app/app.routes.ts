import { Routes } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { loginGuard } from './guards/login-guard';

export const routes: Routes = [
  {
    path: 'register',
    component: Register,
    canActivate: [loginGuard],
  },
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard],
  },
];
