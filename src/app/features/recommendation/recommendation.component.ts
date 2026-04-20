import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecommendationService } from '../../core/services/recommendation.service';
import { Recommendation } from '../../core/models/recommendation.model';
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

  selectedContinents: string[] = [];
  selectedCityTypes: string[] = [];
  selectedClimateTypes: string[] = [];

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

  constructor(
    private service: RecommendationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      if (this.isAuthenticated) {
        this.loadPersonalized();
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

  applyFilters(): void {
    this.loadPersonalized();
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
}