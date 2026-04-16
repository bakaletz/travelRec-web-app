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
    loadComponent: () => import('./features/preferences/preferences.component')
      .then(m => m.PreferencesComponent)
  },
  {
    path: 'trips',
    loadComponent: () => import('./features/trips/trip-list/trip-list.component')
      .then(m => m.TripListComponent)
  },
  {
    path: 'trips/:id',
    loadComponent: () => import('./features/trips/trip-detail/trip-detail.component')
      .then(m => m.TripDetailComponent)
  },
  {
    path: 'trips/:id/rate',
    loadComponent: () => import('./features/trips/trip-rate/trip-rate.component')
      .then(m => m.TripRateComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
