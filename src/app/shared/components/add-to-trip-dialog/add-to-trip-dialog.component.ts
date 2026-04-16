import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../../core/services/trip.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip } from '../../../core/models/trip.model';

@Component({
  selector: 'app-add-to-trip-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-to-trip-dialog.component.html',
  styleUrls: ['./add-to-trip-dialog.component.scss']
})
export class AddToTripDialogComponent implements OnInit {

  @Input() cityId!: number;
  @Input() cityName = '';
  @Output() close = new EventEmitter<void>();
  @Output() added = new EventEmitter<Trip>();

  plannedTrips: Trip[] = [];
  loading = true;
  selectedTripId: number | null = null;

  showCreateNew = false;
  newTripName = '';
  creating = false;
  adding = false;
  successMessage = '';
  errorMessage = '';

  private userId: number | null = null;

  constructor(
    private tripService: TripService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlannedTrips();
  }

  loadPlannedTrips(): void {
    this.tripService.getPlannedTrips().subscribe({
      next: (trips) => {
        this.plannedTrips = trips;
        this.loading = false;
        if (trips.length === 0) {
          this.showCreateNew = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load trips';
        this.cdr.detectChanges();
      }
    });
  }

  selectTrip(tripId: number): void {
    this.selectedTripId = tripId;
  }

  addToSelectedTrip(): void {
    if (!this.selectedTripId) return;
    this.adding = true;
    this.errorMessage = '';

    const selectedTrip = this.plannedTrips.find(t => t.id === this.selectedTripId);
    const visitOrder = selectedTrip ? selectedTrip.cities.length + 1 : 1;

    this.tripService.addCityToTrip(this.selectedTripId, {
      cityId: this.cityId,
      visitOrder
    }).subscribe({
      next: (trip) => {
        this.adding = false;
        this.successMessage = `Added to "${trip.name}"`;
        this.added.emit(trip);
        setTimeout(() => this.close.emit(), 1200);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.adding = false;
        this.errorMessage = err?.error?.message || 'Failed to add city';
        this.cdr.detectChanges();
      }
    });
  }

  toggleCreateNew(): void {
    this.showCreateNew = !this.showCreateNew;
    this.newTripName = '';
  }

  createAndAdd(): void {
    if (!this.newTripName.trim()) return;
    this.creating = true;
    this.errorMessage = '';

    this.tripService.createTrip({
      name: this.newTripName.trim()
    }).subscribe({
      next: (trip) => {
        this.tripService.addCityToTrip(trip.id, {
          cityId: this.cityId,
          visitOrder: 1
        }).subscribe({
          next: (updatedTrip) => {
            this.creating = false;
            this.successMessage = `Created "${trip.name}" and added city`;
            this.added.emit(updatedTrip);
            setTimeout(() => this.close.emit(), 1200);
            this.cdr.detectChanges();
          },
          error: () => {
            this.creating = false;
            this.successMessage = 'Trip created but failed to add city';
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.creating = false;
        this.errorMessage = 'Failed to create trip';
        this.cdr.detectChanges();
      }
    });
  }

  onOverlayClick(): void {
    if (!this.adding && !this.creating) {
      this.close.emit();
    }
  }
}