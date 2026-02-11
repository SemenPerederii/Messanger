import { Routes } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { loginGuard } from './guards/login-guard';
import { Chat } from './chat/chat';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'chat',
    component: Chat,
    canActivate: [authGuard],
  },
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
  {
    path: '**',
    redirectTo: 'chat',
    pathMatch: 'full',
  },
];
