import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recommendation } from '../models/recommendation.model';
import { RecommendationFilters } from '../models/recommendation-filter.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  private apiUrl = `${environment.apiUrl}/recommendations`;

  constructor(private http: HttpClient) {}

  getPersonalized(filters?: RecommendationFilters): Observable<Recommendation[]> {
    const params = this.buildParams(filters);
    return this.http.get<Recommendation[]>(`${this.apiUrl}/personalized`, { params });
  }

  getPopular(limit?: number): Observable<Recommendation[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit);
    }
    return this.http.get<Recommendation[]>(`${this.apiUrl}/popular`, { params });
  }

  getSimilar(cityId: number, limit?: number): Observable<Recommendation[]> {
    let params = new HttpParams().set('cityId', cityId);
    if (limit) {
      params = params.set('limit', limit);
    }
    return this.http.get<Recommendation[]>(`${this.apiUrl}/similar`, { params });
  }

  getBecauseYouLiked(limit?: number): Observable<Recommendation[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit);
    }
    return this.http.get<Recommendation[]>(`${this.apiUrl}/because-you-liked`, { params });
  }

  getNearby(cityId: number, radiusKm: number, limit?: number): Observable<Recommendation[]> {
    let params = new HttpParams()
      .set('cityId', cityId)
      .set('radiusKm', radiusKm);
    if (limit) {
      params = params.set('limit', limit);
    }
    return this.http.get<Recommendation[]>(`${this.apiUrl}/nearby`, { params });
  }

  getNearbyByCoordinates(lat: number, lng: number, radiusKm: number, limit?: number): Observable<Recommendation[]> {
    let params = new HttpParams()
      .set('lat', lat)
      .set('lng', lng)
      .set('radiusKm', radiusKm);
    if (limit) {
      params = params.set('limit', limit);
    }
    return this.http.get<Recommendation[]>(`${this.apiUrl}/nearby-me`, { params });
  }

  private buildParams(filters?: RecommendationFilters): HttpParams {
  let params = new HttpParams();
  if (!filters) return params;

  if (filters.continents?.length) {
    filters.continents.forEach(c => params = params.append('continent', c));
  }
  if (filters.cityTypes?.length) {
    filters.cityTypes.forEach(c => params = params.append('cityType', c));
  }
  if (filters.climateTypes?.length) {
    filters.climateTypes.forEach(c => params = params.append('climateType', c));
  }
  if (filters.limit != null) {
    params = params.set('limit', filters.limit);
  }
  return params;
}
}