import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface City {
  id: number;
  name: string;
  region: string;
  countryName: string;
  cityType: string;
  climateType: string;
  population: number;
  description: string;
  imageUrl: string;
  cultureScore: number;
  foodScore: number;
  nightlifeScore: number;
  natureScore: number;
  safetyScore: number;
  costLevel: number;
  beachScore: number;
  architectureScore: number;
  shoppingScore: number;
  publicTransportScore: number;
  walkabilityScore: number;
  popularity: number;
}

export interface Recommendation {
  city: City;
  similarityScore: number | null;
  reason: string | null;
}

export interface RecommendationFilters {
  continent?: string;
  cityType?: string;
  climateType?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  private apiUrl = 'http://localhost:8080/api/recommendations';

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

  getNearby(cityId: number, radiusKm: number, limit?: number): Observable<Recommendation[]> {
    let params = new HttpParams()
      .set('cityId', cityId)
      .set('radiusKm', radiusKm);
    if (limit) {
      params = params.set('limit', limit);
    }
    return this.http.get<Recommendation[]>(`${this.apiUrl}/nearby`, { params });
  }

  private buildParams(filters?: RecommendationFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    if (filters.continent) {
      params = params.set('continent', filters.continent);
    }
    if (filters.cityType) {
      params = params.set('cityType', filters.cityType);
    }
    if (filters.climateType) {
      params = params.set('climateType', filters.climateType);
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit);
    }
    return params;
  }
}