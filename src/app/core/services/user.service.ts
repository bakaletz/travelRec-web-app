import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPreferences } from '../models/user-preferences.model';
import { User, UpdateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }

  updateCurrentUser(request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/me`, request);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.baseUrl}/me/preferences`);
  }

  updatePreferences(prefs: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.baseUrl}/me/preferences`, prefs);
  }
}