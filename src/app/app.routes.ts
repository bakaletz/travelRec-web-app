import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component')
      .then(m => m.ProfileComponent)
  },
  {
    path: 'cities/:id',
    loadComponent: () => import('./features/city-detail/city-detail.component')
      .then(m => m.CityDetailComponent)
  },
  {
    path: 'countries/:id',
    loadComponent: () => import('./features/country/country-detail/country-detail.component')
      .then(m => m.CountryDetailComponent)
  },
  {
    path: 'countries',
    loadComponent: () => import('./features/country/countries.component')
      .then(m => m.CountriesComponent)
  },
  {
    path: 'preferences',
    canActivate: [authGuard],
    loadComponent: () => import('./features/preferences/preferences.component')
      .then(m => m.PreferencesComponent)
  },
  {
    path: 'trips',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trips/trip-list/trip-list.component')
      .then(m => m.TripListComponent)
  },
  {
    path: 'trips/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trips/trip-detail/trip-detail.component')
      .then(m => m.TripDetailComponent)
  },
  {
    path: 'trips/:id/rate',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trips/trip-rate/trip-rate.component')
      .then(m => m.TripRateComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];