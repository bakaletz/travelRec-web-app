import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../../core/services/trip.service';
import { RatingService } from '../../core/services/rating.service';
import { User } from '../../core/models/user.model';
import { Trip } from '../../core/models/trip.model';
import { RatingResponse } from '../../core/models/rating.model';
import { UserPreferences } from '../../core/models/user-preferences.model';

interface TopPreference {
  key: string;
  label: string;
  icon: string;
  weight: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: User | null = null;
  trips: Trip[] = [];
  ratings: RatingResponse[] = [];
  preferences: UserPreferences | null = null;

  loading = true;
  error: string | null = null;

  editing = false;
  saving = false;
  editFirstName = '';
  editLastName = '';
  editAvatarUrl = '';
  editError: string | null = null;

  private readonly preferenceMeta: Record<string, { label: string; icon: string }> = {
    cultureWeight: { label: 'Culture', icon: '🏛️' },
    foodWeight: { label: 'Food', icon: '🍽️' },
    nightlifeWeight: { label: 'Nightlife', icon: '🌙' },
    natureWeight: { label: 'Nature', icon: '🌿' },
    safetyWeight: { label: 'Safety', icon: '🛡️' },
    budgetWeight: { label: 'Budget', icon: '💰' },
    beachWeight: { label: 'Beach', icon: '🏖️' },
    architectureWeight: { label: 'Architecture', icon: '🏗️' },
    shoppingWeight: { label: 'Shopping', icon: '🛍️' },
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private tripService: TripService,
    private ratingService: RatingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get fullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`.trim();
  }

  get initials(): string {
    if (!this.user) return '?';
    const first = this.user.firstName?.[0] ?? '';
    const last = this.user.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || '?';
  }

  get memberSince(): string {
    if (!this.user?.createdAt) return '';
    const date = new Date(this.user.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  get completedTripsCount(): number {
    return this.trips.filter(t => t.status === 'COMPLETED' || t.status === 'RATED').length;
  }

  get plannedTripsCount(): number {
    return this.trips.filter(t => t.status === 'PLANNED').length;
  }

  get citiesVisitedCount(): number {
    const ids = new Set<number>();
    this.trips
      .filter(t => t.status === 'COMPLETED' || t.status === 'RATED')
      .forEach(t => t.cities.forEach(c => ids.add(c.cityId)));
    return ids.size;
  }

  get ratingsCount(): number {
    return this.ratings.length;
  }

  get detailedRatingsCount(): number {
    return this.ratings.filter(r => r.detailed).length;
  }

  get topPreferences(): TopPreference[] {
    if (!this.preferences) return [];
    return Object.entries(this.preferenceMeta)
      .map(([key, meta]) => ({
        key,
        label: meta.label,
        icon: meta.icon,
        weight: (this.preferences as any)[key] as number ?? 0,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }

  get recentTrips(): Trip[] {
    return [...this.trips]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  startEdit(): void {
    if (!this.user) return;
    this.editFirstName = this.user.firstName;
    this.editLastName = this.user.lastName;
    this.editAvatarUrl = this.user.avatarUrl ?? '';
    this.editError = null;
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editError = null;
  }

  saveEdit(): void {
    if (!this.user) return;
    const firstName = this.editFirstName.trim();
    const lastName = this.editLastName.trim();

    if (!firstName || !lastName) {
      this.editError = 'First name and last name are required';
      return;
    }

    this.saving = true;
    this.editError = null;

    this.userService.updateCurrentUser({
      firstName,
      lastName,
      avatarUrl: this.editAvatarUrl.trim(),
    }).subscribe({
      next: (updated) => {
        this.user = updated;
        this.authService.updateCurrentUser({
          firstName: updated.firstName,
          lastName: updated.lastName,
          avatarUrl: updated.avatarUrl,
        });
        this.saving = false;
        this.editing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.editError = err?.error?.message || 'Failed to update profile';
        this.cdr.detectChanges();
      }
    });
  }

  tripStatusLabel(status: string): string {
    switch (status) {
      case 'PLANNED': return 'Planned';
      case 'COMPLETED': return 'Completed';
      case 'RATED': return 'Rated';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  private loadAll(): void {
    this.loading = true;
    forkJoin({
      user: this.userService.getCurrentUser(),
      trips: this.tripService.getUserTrips(),
      ratings: this.ratingService.getCurrentUserRatings(),
      preferences: this.userService.getPreferences(),
    }).subscribe({
      next: ({ user, trips, ratings, preferences }) => {
        this.user = user;
        this.trips = trips;
        this.ratings = ratings;
        this.preferences = preferences;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load profile';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}