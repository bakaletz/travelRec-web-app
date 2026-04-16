import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TripService } from '../../../core/services/trip.service';
import { RatingService } from '../../../core/services/rating.service';
import { Trip, TripCity } from '../../../core/models/trip.model';
import { RatingResponse, DetailedRatingRequest } from '../../../core/models/rating.model';

interface CategoryRating {
  key: string;
  label: string;
  icon: string;
  value: number | null;
}

@Component({
  selector: 'app-trip-rate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './trip-rate.component.html',
  styleUrls: ['./trip-rate.component.scss']
})
export class TripRateComponent implements OnInit {

  trip: Trip | null = null;
  existingRatings: Map<number, RatingResponse> = new Map();
  loading = true;
  error: string | null = null;

  currentIndex = 0;
  quickScore: number | null = null;
  showDetailed = false;
  feedback = '';
  saving = false;
  saved = false;

  categories: CategoryRating[] = [
    { key: 'cultureRating', label: 'Culture', icon: '🏛️', value: null },
    { key: 'foodRating', label: 'Food', icon: '🍽️', value: null },
    { key: 'nightlifeRating', label: 'Nightlife', icon: '🌙', value: null },
    { key: 'natureRating', label: 'Nature', icon: '🌿', value: null },
    { key: 'safetyRating', label: 'Safety', icon: '🛡️', value: null },
    { key: 'costRating', label: 'Value for Money', icon: '💰', value: null },
    { key: 'beachRating', label: 'Beach', icon: '🏖️', value: null },
    { key: 'architectureRating', label: 'Architecture', icon: '🏗️', value: null },
    { key: 'shoppingRating', label: 'Shopping', icon: '🛍️', value: null },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private ratingService: RatingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadTrip(id);
    });
  }

  get sortedCities(): TripCity[] {
    if (!this.trip) return [];
    return [...this.trip.cities].sort((a, b) => a.visitOrder - b.visitOrder);
  }

  get currentCity(): TripCity | null {
    const cities = this.sortedCities;
    return cities[this.currentIndex] ?? null;
  }

  get isFirst(): boolean {
    return this.currentIndex === 0;
  }

  get isLast(): boolean {
    return this.currentIndex === this.sortedCities.length - 1;
  }

  get progress(): number {
    const total = this.sortedCities.length;
    if (total === 0) return 0;
    return ((this.currentIndex + 1) / total) * 100;
  }

  get ratedCount(): number {
    return this.existingRatings.size;
  }

  get isCurrentRated(): boolean {
    if (!this.currentCity) return false;
    return this.existingRatings.has(this.currentCity.cityId);
  }

  get hasUnsavedChanges(): boolean {
    if (!this.currentCity || this.quickScore === null) return false;
    const existing = this.existingRatings.get(this.currentCity.cityId);
    if (!existing) return true;

    if (existing.overallScore !== this.quickScore) return true;
    if ((existing.feedback || '') !== (this.feedback || '')) return true;
    for (const c of this.categories) {
      const prev = (existing as any)[c.key] ?? null;
      if (prev !== c.value) return true;
    }
    return false;
  }

  setQuickScore(score: number): void {
    this.quickScore = score;
    this.saved = false;
  }

  getQuickLabel(score: number): string {
    if (score === 5) return '👍 Loved it';
    if (score === 3) return '😐 It was okay';
    return '👎 Not for me';
  }

  toggleDetailed(): void {
    this.showDetailed = !this.showDetailed;
  }

  setStarRating(cat: CategoryRating, stars: number): void {
    cat.value = cat.value === stars ? null : stars;
    this.saved = false;
  }

  submitRating(): void {
    this.saveCurrent().subscribe();
  }

  goNext(): void {
    this.saveCurrent().subscribe(ok => {
      if (!ok) return;
      if (this.isLast) {
        this.router.navigate(['/trips', this.trip!.id]);
        return;
      }
      this.currentIndex++;
      this.loadCityState();
    });
  }

  goPrev(): void {
    if (this.isFirst) return;
    this.saveCurrent().subscribe(ok => {
      if (!ok) return;
      this.currentIndex--;
      this.loadCityState();
    });
  }

  goToCity(index: number): void {
    if (index === this.currentIndex) return;
    this.saveCurrent().subscribe(ok => {
      if (!ok) return;
      this.currentIndex = index;
      this.loadCityState();
    });
  }

  finish(): void {
    this.saveCurrent().subscribe(ok => {
      if (!ok) return;
      this.router.navigate(['/trips', this.trip!.id]);
    });
  }

  private saveCurrent(): Observable<boolean> {
    if (!this.trip || !this.currentCity) return of(true);
    if (this.quickScore === null) return of(true);
    if (!this.hasUnsavedChanges) return of(true);

    return new Observable<boolean>(subscriber => {
      this.saving = true;
      this.cdr.detectChanges();

      const hasDetailed = this.categories.some(c => c.value !== null);
      const baseRequest = {
        tripId: this.trip!.id,
        cityId: this.currentCity!.cityId,
        overallScore: this.quickScore!,
        feedback: this.feedback || undefined,
      };

      const handleSuccess = (rating: RatingResponse) => {
        this.onRatingSaved(rating);
        subscriber.next(true);
        subscriber.complete();
      };

      const handleError = (err: any) => {
        this.onRatingError(err);
        subscriber.next(false);
        subscriber.complete();
      };

      if (hasDetailed) {
        const request: DetailedRatingRequest = { ...baseRequest };
        this.categories.forEach(c => {
          if (c.value !== null) {
            (request as any)[c.key] = c.value;
          }
        });
        this.ratingService.createDetailedRating(request).subscribe({
          next: handleSuccess,
          error: handleError,
        });
      } else {
        this.ratingService.createQuickRating(baseRequest).subscribe({
          next: handleSuccess,
          error: handleError,
        });
      }
    });
  }

  private loadTrip(id: number): void {
    this.loading = true;
    this.tripService.getTripById(id).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loadExistingRatings(id);
      },
      error: () => {
        this.error = 'Trip not found';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadExistingRatings(tripId: number): void {
    this.ratingService.getRatingsByTrip(tripId).subscribe({
      next: (ratings) => {
        ratings.forEach(r => this.existingRatings.set(r.cityId, r));
        this.loading = false;
        this.loadCityState();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadCityState();
        this.cdr.detectChanges();
      }
    });
  }

  private loadCityState(): void {
    const city = this.currentCity;
    if (!city) return;

    const existing = this.existingRatings.get(city.cityId);
    if (existing) {
      this.quickScore = existing.overallScore;
      this.feedback = existing.feedback || '';
      this.showDetailed = existing.detailed;
      this.categories.forEach(c => {
        c.value = (existing as any)[c.key] ?? null;
      });
      this.saved = true;
    } else {
      this.quickScore = null;
      this.feedback = '';
      this.showDetailed = false;
      this.categories.forEach(c => c.value = null);
      this.saved = false;
    }
    this.cdr.detectChanges();
  }

  private onRatingSaved(rating: RatingResponse): void {
    this.existingRatings.set(rating.cityId, rating);
    this.saving = false;
    this.saved = true;
    this.cdr.detectChanges();
  }

  private onRatingError(err: any): void {
    this.saving = false;
    this.error = err?.error?.message || 'Failed to save rating';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.error = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}