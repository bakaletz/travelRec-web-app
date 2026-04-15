import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { City } from '../models/city.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CityService {

  private apiUrl = `${environment.apiUrl}/cities`;

  constructor(private http: HttpClient) { }

  getById(id: number): Observable<City> {
    return this.http.get<City>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl);
  }

  getNearby(cityId: number, radiusKm: number = 300): Observable<City[]> {
    const params = new HttpParams()
      .set('radiusKm', radiusKm);
    return this.http.get<City[]>(`${this.apiUrl}/${cityId}/nearby`, { params });
  }

  getSameCountry(cityId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}/${cityId}/same-country`);
  }

  search(query: string): Observable<City[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<City[]>(this.apiUrl, { params });
  }

  getByCountryId(countryId: number): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl, {
      params: { countryId: countryId.toString() }
    });
  }

  create(data: any): Observable<City> {
    return this.http.post<City>(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<City> {
    return this.http.put<City>(`${this.apiUrl}/${id}`, data);
  }
}