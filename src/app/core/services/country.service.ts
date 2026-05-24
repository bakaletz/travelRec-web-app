import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Country } from '../models/country.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CountryService {

  private readonly baseUrl = `${environment.apiUrl}/countries`;

  constructor(private http: HttpClient) { }

  getById(id: number): Observable<Country> {
    return this.http.get<Country>(`${this.baseUrl}/${id}`);
  }

  getAll(continent?: string): Observable<Country[]> {
    if (continent) {
      return this.http.get<Country[]>(this.baseUrl, { params: { continent } });
    }
    return this.http.get<Country[]>(this.baseUrl);
  }

  search(query: string): Observable<Country[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<Country[]>(this.baseUrl, { params });
  }

  create(data: Partial<Country>): Observable<Country> {
    return this.http.post<Country>(this.baseUrl, data);
  }

  update(id: number, data: Partial<Country>): Observable<Country> {
    return this.http.put<Country>(`${this.baseUrl}/${id}`, data);
  }
}