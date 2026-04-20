import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, TripRequest, TripStatus, AddCityToTripRequest } from '../models/trip.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TripService {

    private apiUrl = `${environment.apiUrl}/trips`;

    constructor(private http: HttpClient) { }

    getUserTrips(status?: TripStatus): Observable<Trip[]> {
        let params = new HttpParams();
        if (status) {
            params = params.set('status', status);
        }
        return this.http.get<Trip[]>(this.apiUrl, { params });
    }

    getPlannedTrips(): Observable<Trip[]> {
        return this.getUserTrips('PLANNED');
    }

    getTripById(id: number): Observable<Trip> {
        return this.http.get<Trip>(`${this.apiUrl}/${id}`);
    }

    createTrip(request: TripRequest): Observable<Trip> {
        return this.http.post<Trip>(this.apiUrl, request);
    }

    updateTrip(id: number, request: TripRequest): Observable<Trip> {
        return this.http.put<Trip>(`${this.apiUrl}/${id}`, request);
    }

    completeTrip(id: number): Observable<Trip> {
        return this.http.patch<Trip>(`${this.apiUrl}/${id}/complete`, {});
    }

    cancelTrip(id: number): Observable<Trip> {
        return this.http.patch<Trip>(`${this.apiUrl}/${id}/cancel`, {});
    }

    addCityToTrip(tripId: number, request: AddCityToTripRequest): Observable<Trip> {
        return this.http.post<Trip>(`${this.apiUrl}/${tripId}/cities`, request);
    }

    removeCityFromTrip(tripId: number, cityId: number): Observable<Trip> {
        return this.http.delete<Trip>(`${this.apiUrl}/${tripId}/cities/${cityId}`);
    }

    reorderCities(tripId: number, cityIds: number[]): Observable<Trip> {
        return this.http.patch<Trip>(`${this.apiUrl}/${tripId}/reorder`, cityIds);
    }

    optimizeRoute(tripId: number): Observable<Trip> {
        return this.http.patch<Trip>(`${this.apiUrl}/${tripId}/optimize`, {});
    }

    deleteTrip(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}