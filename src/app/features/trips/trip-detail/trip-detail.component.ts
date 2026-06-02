import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../../core/services/trip.service';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { Trip, TripCity, TripStatus } from '../../../core/models/trip.model';
import { City } from '../../../core/models/city.model';
import { Recommendation } from '../../../core/models/recommendation.model';
import { CityCarouselComponent } from '../../../shared/components/city/city-carousel/city-carousel.component';
import { RouteMapComponent, MapPoint } from '../../../shared/components/route-map/route-map.component';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CityCarouselComponent, RouteMapComponent],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.scss'],
  styles: [`
    .field-error {
      margin: 0.4rem 0 0 0;
      font-size: 0.8rem;
      color: #dc2626;
    }
  `]
})
export class TripDetailComponent implements OnInit {

  trip: Trip | null = null;
  loading = true;
  error: string | null = null;
  actionLoading = false;
  optimizing = false;

  showDeleteConfirm = false;
  cityToRemove: TripCity | null = null;

  nearbyRecommendations: Recommendation[] = [];
  nearbyLoading = false;
  nearbyRadiusKm = 500;
  radiusOptions = [200, 500, 1000];

  showTripDialog = false;
  tripDialogCityId: number | null = null;
  tripDialogCityName = '';

  editingName = false;
  editName = '';
  editingDates = false;
  editStartDate = '';
  editEndDate = '';
  dateError: string | null = null;
  completeError: string | null = null;

  dragIndex: number | null = null;
  dragOverIndex: number | null = null;

  nearbyScoreFn = (city: City): number | null => {
    const item = this.nearbyRecommendations.find(i => i.city.id === city.id);
    return item ? item.similarityScore : null;
  };

  nearbyDistanceFn = (city: City): number | null => {
    const item = this.nearbyRecommendations.find(i => i.city.id === city.id);
    return item ? item.distanceKm : null;
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private recommendationService: RecommendationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadTrip(id);
    });
  }

  loadTrip(id: number): void {
    this.loading = true;
    this.tripService.getTripById(id).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadNearby();
      },
      error: () => {
        this.error = 'Trip not found';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get isPlanned(): boolean {
    return this.trip?.status === 'PLANNED';
  }

  get isCompleted(): boolean {
    return this.trip?.status === 'COMPLETED';
  }

  get sortedCities(): TripCity[] {
    if (!this.trip) return [];
    return [...this.trip.cities].sort((a, b) => a.visitOrder - b.visitOrder);
  }

  get mapPoints(): MapPoint[] {
    return this.sortedCities
      .filter(c => c.latitude != null && c.longitude != null)
      .map(c => ({ lat: c.latitude as number, lng: c.longitude as number, label: c.cityName }));
  }

  get nearbyCities(): City[] {
    return this.nearbyRecommendations.map(r => r.city);
  }

  getStatusClass(status: TripStatus): string {
    return 'status-' + status.toLowerCase();
  }

  getStatusLabel(status: TripStatus): string {
    const labels: Record<TripStatus, string> = {
      PLANNED: 'Planned',
      COMPLETED: 'Completed',
      RATED: 'Rated',
      CANCELLED: 'Cancelled'
    };
    return labels[status];
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  getDurationDays(): number | null {
    if (!this.trip?.startDate || !this.trip?.endDate) return null;
    const start = new Date(this.trip.startDate).getTime();
    const end = new Date(this.trip.endDate).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : null;
  }

  getRouteString(): string {
    return this.sortedCities.map(c => c.cityName).join('  →  ');
  }

  startEditName(): void {
    if (!this.isPlanned) return;
    this.editName = this.trip?.name || '';
    this.editingName = true;
  }

  saveName(): void {
    if (!this.trip || !this.editName.trim()) return;
    this.tripService.updateTrip(this.trip.id, {
      name: this.editName.trim(),
      startDate: this.trip.startDate || undefined,
      endDate: this.trip.endDate || undefined
    }).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.editingName = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelEditName(): void {
    this.editingName = false;
  }

  startEditDates(): void {
    if (!this.isPlanned) return;
    this.editStartDate = this.trip?.startDate || '';
    this.editEndDate = this.trip?.endDate || '';
    this.editingDates = true;
  }

  saveDates(): void {
    if (!this.trip) return;

    if (this.editStartDate && this.editEndDate
      && new Date(this.editStartDate).getTime() > new Date(this.editEndDate).getTime()) {
      this.dateError = 'Start date cannot be after end date';
      this.cdr.detectChanges();
      return;
    }
    this.dateError = null;

    this.tripService.updateTrip(this.trip.id, {
      name: this.trip.name,
      startDate: this.editStartDate || undefined,
      endDate: this.editEndDate || undefined
    }).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.editingDates = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelEditDates(): void {
    this.editingDates = false;
  }

  onDragStart(index: number): void {
    this.dragIndex = index;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDragLeave(): void {
    this.dragOverIndex = null;
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.dragIndex === null || this.dragIndex === dropIndex || !this.trip) {
      this.dragIndex = null;
      this.dragOverIndex = null;
      return;
    }

    const cities = this.sortedCities;
    const [moved] = cities.splice(this.dragIndex, 1);
    cities.splice(dropIndex, 0, moved);
    cities.forEach((city, i) => city.visitOrder = i + 1);
    this.trip.cities = cities;
    this.dragIndex = null;
    this.dragOverIndex = null;
    this.cdr.detectChanges();

    const cityIds = cities.map(c => c.cityId);
    this.tripService.reorderCities(this.trip.id, cityIds).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.cdr.detectChanges();
      }
    });
  }

  onDragEnd(): void {
    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  completeTrip(): void {
    if (!this.trip) return;

    this.completeError = null;

    if (!this.trip.startDate || !this.trip.endDate) {
      this.completeError = 'Add start and end dates before completing this trip';
      this.cdr.detectChanges();
      return;
    }
    if (new Date(this.trip.startDate).getTime() > new Date(this.trip.endDate).getTime()) {
      this.completeError = 'Start date cannot be after end date';
      this.cdr.detectChanges();
      return;
    }

    this.actionLoading = true;
    this.tripService.completeTrip(this.trip.id).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.actionLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.completeError = err?.error?.message ?? 'Could not complete this trip';
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (new Date(this.trip.endDate).getTime() > todayEnd.getTime()) {
      this.completeError = 'You can complete this trip only after it ends';
      this.cdr.detectChanges();
      return;
    }
  }

  cancelTrip(): void {
    if (!this.trip) return;
    this.actionLoading = true;
    this.tripService.cancelTrip(this.trip.id).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.actionLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmRemoveCity(event: Event, city: TripCity): void {
    event.stopPropagation();
    this.cityToRemove = city;
  }

  cancelRemoveCity(): void {
    this.cityToRemove = null;
  }

  removeCity(): void {
    if (!this.trip || !this.cityToRemove) return;
    this.tripService.removeCityFromTrip(this.trip.id, this.cityToRemove.cityId).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.cityToRemove = null;
        this.cdr.detectChanges();
        this.loadNearby();
      }
    });
  }

  confirmDeleteTrip(): void {
    this.showDeleteConfirm = true;
  }

  cancelDeleteTrip(): void {
    this.showDeleteConfirm = false;
  }

  deleteTrip(): void {
    if (!this.trip) return;
    this.tripService.deleteTrip(this.trip.id).subscribe({
      next: () => this.router.navigate(['/trips'])
    });
  }

  addNearbyDirectly(city: City): void {
    if (!this.trip) return;
    const visitOrder = this.trip.cities.length + 1;
    this.tripService.addCityToTrip(this.trip.id, {
      cityId: city.id,
      visitOrder
    }).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loadNearby();
        this.cdr.detectChanges();
      }
    });
  }

  onAddNearbyToTrip(city: City): void {
    if (!this.trip) return;
    const visitOrder = this.trip.cities.length + 1;
    this.tripService.addCityToTrip(this.trip.id, {
      cityId: city.id,
      visitOrder
    }).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loadNearby();
        this.cdr.detectChanges();
      }
    });
  }
  onTripDialogClose(): void {
    this.showTripDialog = false;
  }

  getUniqueCountries(): number {
    if (!this.trip) return 0;
    return new Set(this.trip.cities.map(c => c.countryName)).size;
  }

  goBack(): void {
    this.router.navigate(['/trips']);
  }

  isRouteSuboptimal(index: number): boolean {
    const cities = this.sortedCities;
    if (index === 0 || cities.length < 3) return false;

    const prev = cities[index - 1];
    const curr = cities[index];
    const next = cities[index + 1];

    if (!prev.latitude || !curr.latitude) return false;

    const distPrevCurr = this.haversine(prev, curr);

    if (!next?.latitude) return false;

    const distCurrNext = this.haversine(curr, next);
    const distPrevNext = this.haversine(prev, next);

    return distPrevCurr + distCurrNext > distPrevNext * 1.8;
  }

  getTotalDistance(): number {
    let total = 0;
    const cities = this.sortedCities;
    for (let i = 1; i < cities.length; i++) {
      if (cities[i - 1].latitude && cities[i].latitude) {
        total += this.haversine(cities[i - 1], cities[i]);
      }
    }
    return Math.round(total);
  }

  optimizeRoute(): void {
    if (!this.trip) return;
    this.optimizing = true;
    this.tripService.optimizeRoute(this.trip.id).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.optimizing = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.optimizing = false;
        this.cdr.detectChanges();
      }
    });
  }


  private haversine(a: { latitude: number | null; longitude: number | null },
    b: { latitude: number | null; longitude: number | null }): number {
    if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
    const R = 6371;
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLon = (b.longitude - a.longitude) * Math.PI / 180;
    const lat1 = a.latitude * Math.PI / 180;
    const lat2 = b.latitude * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private loadNearby(): void {
    if (!this.trip || this.trip.cities.length === 0) {
      this.nearbyRecommendations = [];
      return;
    }
    const lastCity = this.sortedCities[this.sortedCities.length - 1];
    this.nearbyLoading = true;
    this.recommendationService.getNearby(lastCity.cityId, this.nearbyRadiusKm, 8).subscribe({
      next: (data) => {
        const tripCityIds = new Set(this.trip!.cities.map(c => c.cityId));
        this.nearbyRecommendations = data.filter(r => !tripCityIds.has(r.city.id));
        this.nearbyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.nearbyRecommendations = [];
        this.nearbyLoading = false;
      }
    });
  }

  setNearbyRadius(km: number): void {
    if (this.nearbyRadiusKm === km) return;
    this.nearbyRadiusKm = km;
    this.loadNearby();
  }

}