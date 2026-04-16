import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, TripStatus } from '../../../core/models/trip.model';
import { FormsModule } from '@angular/forms';
import { FilterByStatusPipe } from '../../../shared/pipes/filter-by-status.pipe';
import { CityNamesPipe } from '../../../shared/pipes/city-names.pipe';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterByStatusPipe, CityNamesPipe],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.scss']
})
export class TripListComponent implements OnInit {

  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  loading = true;
  error: string | null = null;

  activeTab: TripStatus | 'ALL' = 'ALL';
  tabs: { label: string; value: TripStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Planned', value: 'PLANNED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rated', value: 'RATED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  showCreateDialog = false;
  newTripName = '';
  newTripStartDate = '';
  newTripEndDate = '';
  creating = false;

  private userId: number | null = null;

  constructor(
    private tripService: TripService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading = true;
    this.tripService.getUserTrips().subscribe({
      next: (trips) => {
        this.trips = trips.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load trips';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: TripStatus | 'ALL'): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeTab === 'ALL') {
      this.filteredTrips = this.trips;
    } else {
      this.filteredTrips = this.trips.filter(t => t.status === this.activeTab);
    }
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

  getCityCount(trip: Trip): number {
    return trip.cities?.length || 0;
  }

  getDateRange(trip: Trip): string {
    if (!trip.startDate) return 'No dates set';
    const start = new Date(trip.startDate).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    if (!trip.endDate) return start;
    const end = new Date(trip.endDate).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return `${start} — ${end}`;
  }

  getTripPreviewImages(trip: Trip): string[] {
    return trip.cities
      .filter(c => c.imageUrl)
      .slice(0, 3)
      .map(c => c.imageUrl);
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
    this.newTripName = '';
    this.newTripStartDate = '';
    this.newTripEndDate = '';
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  createTrip(): void {
    if (!this.newTripName.trim()) return;
    this.creating = true;
    this.tripService.createTrip({
      name: this.newTripName.trim(),
      startDate: this.newTripStartDate || undefined,
      endDate: this.newTripEndDate || undefined
    }).subscribe({
      next: (trip) => {
        this.trips.unshift(trip);
        this.applyFilter();
        this.showCreateDialog = false;
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }
}