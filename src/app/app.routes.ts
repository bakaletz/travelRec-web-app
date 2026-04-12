import { Routes } from '@angular/router';

export const routes: Routes = [
     {
    path: '',
    loadComponent: () => import('./features/recommendation/recommendation.component')
      .then(m => m.RecommendationComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
