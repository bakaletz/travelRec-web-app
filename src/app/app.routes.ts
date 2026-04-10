import { Routes } from '@angular/router';
import { RecommendationComponent } from './features/recommendation/recommendation.component';

export const routes: Routes = [
     { path: '', redirectTo: 'recommendation', pathMatch: 'full' },
     { path: 'recommendation', component: RecommendationComponent }
];
