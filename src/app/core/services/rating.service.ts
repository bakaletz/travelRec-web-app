import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RatingResponse, QuickRatingRequest, DetailedRatingRequest } from '../models/rating.model';
import { environment } from '../../../environments/environment';
import { UserCityRating } from '../models/rating.model';

@Injectable({
  providedIn: 'root'
})
export class RatingService {

  private apiUrl = `${environment.apiUrl}/ratings`;

  constructor(private http: HttpClient) {}

  getRatingsByTrip(tripId: number): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`${this.apiUrl}/trip/${tripId}`);
  }

  getCurrentUserRatings(): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`${this.apiUrl}/user/me`);
  }

  createQuickRating(request: QuickRatingRequest): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(`${this.apiUrl}/quick`, request);
  }

  createDetailedRating(request: DetailedRatingRequest): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(`${this.apiUrl}/detailed`, request);
  }

  updateRating(id: number, request: DetailedRatingRequest): Observable<RatingResponse> {
    return this.http.put<RatingResponse>(`${this.apiUrl}/${id}`, request);
  }

  getUserCityRating(cityId: number): Observable<UserCityRating> {
  return this.http.get<UserCityRating>(`${this.apiUrl}/city/${cityId}/me`);
}
}