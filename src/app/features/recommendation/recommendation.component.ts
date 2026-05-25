import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { concatMap, from, of, toArray } from 'rxjs';
import { RecommendationService } from '../../core/services/recommendation.service';
import { TripService } from '../../core/services/trip.service';
import { Recommendation } from '../../core/models/recommendation.model';
import { TripRecommendation } from '../../core/models/trip-recomendation.model';
import { RecommendationFilters } from '../../core/models/recommendation-filter.model';
import { City } from '../../core/models/city.model';
import { MultiSelectModule } from 'primeng/multiselect';
import { CityCarouselComponent } from '../../shared/components/city/city-carousel/city-carousel.component';
import { AuthService } from '../../core/services/auth.service';

interface FilterOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
    MultiSelectModule,
    CityCarouselComponent
  ],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.scss']
})
export class RecommendationComponent implements OnInit {

  isAuthenticated = false;

  personalizedItems: Recommendation[] = [];
  popularItems: Recommendation[] = [];
  nearbyMeItems: Recommendation[] = [];
  likedItems: Recommendation[] = [];
  recommendedTrips: TripRecommendation[] = [];

  tripsState: 'idle' | 'loading' | 'loaded' | 'empty' = 'idle';
  savingTripIndex: number | null = null;
  savedTripIndexes = new Set<number>();

  nearbyMeState: 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'empty' = 'idle';
  nearbyMeRadiusKm = 500;

  likedSeedLabel: string | null = null;

  selectedContinents: string[] = [];
  selectedCityTypes: string[] = [];
  selectedClimateTypes: string[] = [];

  selectedTripContinents: string[] = [];

  continentOptions: FilterOption[] = [
    { label: 'Europe', value: 'EUROPE' },
    { label: 'Asia', value: 'ASIA' },
    { label: 'North America', value: 'NORTH_AMERICA' },
    { label: 'South America', value: 'SOUTH_AMERICA' },
    { label: 'Africa', value: 'AFRICA' },
    { label: 'Oceania', value: 'OCEANIA' },
    { label: 'Antarctica', value: 'ANTARCTICA' },
  ];

  cityTypeOptions: FilterOption[] = [
    { label: 'Megapolis', value: 'MEGAPOLIS' },
    { label: 'Large City', value: 'LARGE_CITY' },
    { label: 'Medium City', value: 'MEDIUM_CITY' },
    { label: 'Small Town', value: 'SMALL_TOWN' },
    { label: 'Resort', value: 'RESORT' },
  ];

  climateTypeOptions: FilterOption[] = [
    { label: 'Tropical', value: 'TROPICAL' },
    { label: 'Dry', value: 'DRY' },
    { label: 'Continental', value: 'CONTINENTAL' },
    { label: 'Temperate', value: 'TEMPERATE' },
    { label: 'Mediterranean', value: 'MEDITERRANEAN' },
    { label: 'Polar', value: 'POLAR' },
    { label: 'Oceanic', value: 'OCEANIC' }
  ];

  personalizedScoreFn = (city: City): number | null => {
    const item = this.personalizedItems.find(i => i.city.id === city.id);
    return item ? item.similarityScore : null;
  };

  popularScoreFn = (city: City): number | null => {
    return city.popularity ?? null;
  };

  nearbyMeScoreFn = (city: City): number | null => {
    const item = this.nearbyMeItems.find(i => i.city.id === city.id);
    return item ? item.similarityScore : null;
  };

  nearbyMeDistanceFn = (city: City): number | null => {
    const item = this.nearbyMeItems.find(i => i.city.id === city.id);
    return item ? item.distanceKm : null;
  };

  likedScoreFn = (city: City): number | null => {
    const item = this.likedItems.find(i => i.city.id === city.id);
    return item ? item.similarityScore : null;
  };

  constructor(
    private service: RecommendationService,
    private tripService: TripService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      if (this.isAuthenticated) {
        this.loadPersonalized();
        this.loadBecauseYouLiked();
        this.loadRecommendedTrips();
      } else {
        this.likedItems = [];
        this.likedSeedLabel = null;
        this.recommendedTrips = [];
        this.tripsState = 'idle';
        this.savedTripIndexes.clear();
      }
      this.cdr.detectChanges();
    });
    this.loadPopular();
  }

  get personalizedCities(): City[] {
    return this.personalizedItems.map(i => i.city);
  }

  get popularCities(): City[] {
    return this.popularItems.map(i => i.city);
  }

  get nearbyMeCities(): City[] {
    return this.nearbyMeItems.map(i => i.city);
  }

  get likedCities(): City[] {
    return this.likedItems.map(i => i.city);
  }

  applyFilters(): void {
    this.loadPersonalized();
  }

  applyTripFilters(): void {
    this.loadRecommendedTrips();
  }

  hasActiveFilters(): boolean {
    return this.selectedContinents.length > 0
      || this.selectedCityTypes.length > 0
      || this.selectedClimateTypes.length > 0;
  }

  clearFilters(): void {
    this.selectedContinents = [];
    this.selectedCityTypes = [];
    this.selectedClimateTypes = [];
    this.applyFilters();
  }

  onAddToTrip(city: City): void {
    console.log('Add to trip:', city.name);
  }

  tripRouteLabel(trip: TripRecommendation): string {
    return trip.cities.map(c => c.name).join(' → ');
  }

  saveTripAsTrip(trip: TripRecommendation, index: number): void {
    if (this.savingTripIndex !== null || this.savedTripIndexes.has(index)) return;

    this.savingTripIndex = index;
    this.cdr.detectChanges();

    const name = this.suggestTripName(trip);

    this.tripService.createTrip({ name }).pipe(
      concatMap(created =>
        from(trip.cities.map((city, i) => ({ city, order: i + 1 }))).pipe(
          concatMap(entry =>
            this.tripService.addCityToTrip(created.id, {
              cityId: entry.city.id,
              visitOrder: entry.order
            })
          ),
          toArray(),
          concatMap(() => of(created))
        )
      )
    ).subscribe({
      next: () => {
        this.savingTripIndex = null;
        this.savedTripIndexes.add(index);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Save-as-trip error:', err);
        this.savingTripIndex = null;
        this.cdr.detectChanges();
      }
    });
  }

  private suggestTripName(trip: TripRecommendation): string {
    if (trip.cities.length === 1) {
      return `${trip.cities[0].name} getaway`;
    }
    const first = trip.cities[0].name;
    const last = trip.cities[trip.cities.length - 1].name;
    return `${first} to ${last} (${trip.suggestedDurationDays} days)`;
  }

  requestNearbyMe(): void {
    if (!navigator.geolocation) {
      this.nearbyMeState = 'unavailable';
      this.cdr.detectChanges();
      return;
    }

    this.nearbyMeState = 'loading';
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.loadNearbyMe(latitude, longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          this.nearbyMeState = 'denied';
        } else {
          this.nearbyMeState = 'unavailable';
        }
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  private loadNearbyMe(lat: number, lng: number): void {
    this.service.getNearbyByCoordinates(lat, lng, this.nearbyMeRadiusKm, 10).subscribe({
      next: (data) => {
        this.nearbyMeItems = data;
        this.nearbyMeState = data.length > 0 ? 'granted' : 'empty';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Nearby-me error:', err);
        this.nearbyMeState = 'unavailable';
        this.cdr.detectChanges();
      }
    });
  }

  private loadPersonalized(): void {
    const filters: RecommendationFilters = { limit: 10 };
    if (this.selectedContinents.length) filters.continents = this.selectedContinents;
    if (this.selectedCityTypes.length) filters.cityTypes = this.selectedCityTypes;
    if (this.selectedClimateTypes.length) filters.climateTypes = this.selectedClimateTypes;

    this.service.getPersonalized(filters).subscribe({
      next: (data) => {
        this.personalizedItems = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Personalized error:', err)
    });
  }

  private loadPopular(): void {
    this.service.getPopular(10).subscribe({
      next: (data) => {
        this.popularItems = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Popular error:', err)
    });
  }

  private loadBecauseYouLiked(): void {
    this.service.getBecauseYouLiked(10).subscribe({
      next: (data) => {
        this.likedItems = data;
        this.likedSeedLabel = data.length > 0 ? (data[0].reason ?? null) : null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Because-you-liked error:', err);
        this.likedItems = [];
        this.likedSeedLabel = null;
        this.cdr.detectChanges();
      }
    });
  }

  private loadRecommendedTrips(): void {
    this.tripsState = 'loading';
    this.cdr.detectChanges();

    const continents = this.selectedTripContinents.length ? this.selectedTripContinents : undefined;
    this.service.getRecommendedTrips(continents).subscribe({
      next: (data) => {
        this.recommendedTrips = data;
        this.tripsState = data.length > 0 ? 'loaded' : 'empty';
        this.savedTripIndexes.clear();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Recommended-trips error:', err);
        this.recommendedTrips = [];
        this.tripsState = 'empty';
        this.cdr.detectChanges();
      }
    });
  }
}