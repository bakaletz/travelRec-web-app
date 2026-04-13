import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecommendationService } from '../../core/services/recommendation.service';
import { Recommendation } from '../../core/models/recommendation.model';
import { RecommendationFilters } from '../../core/models/recommendation-filter.model';
import { City } from '../../core/models/city.model';
import { MultiSelectModule } from 'primeng/multiselect';
import { CityCardComponent } from '../../shared/components/city-card/city-card.component';

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
    CityCardComponent
  ],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.scss']
})
export class RecommendationComponent implements OnInit {

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

  personalizedOffset = 0;
  popularOffset = 0;
  canScrollPersonalizedLeft = false;
  canScrollPersonalizedRight = false;
  canScrollPopularLeft = false;
  canScrollPopularRight = false;

  private visibleCount = 5;
  private gap = 20;

  @ViewChild('personalizedWrapper') personalizedWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('popularWrapper') popularWrapper!: ElementRef<HTMLDivElement>;

  constructor(
    private service: RecommendationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPersonalized();
    this.loadPopular();
  }

  applyFilters(): void {
    this.personalizedOffset = 0;
    this.loadPersonalized();
  }

  scroll(section: 'personalized' | 'popular', direction: 'left' | 'right'): void {
    const wrapper = section === 'personalized' ? this.personalizedWrapper : this.popularWrapper;
    if (!wrapper) return;

    const wrapperWidth = wrapper.nativeElement.offsetWidth;
    const items = section === 'personalized' ? this.personalizedItems : this.popularItems;
    const cardW = (wrapperWidth + this.gap) / this.visibleCount;
    const totalWidth = items.length * cardW - this.gap;
    const maxOffset = Math.max(0, totalWidth - wrapperWidth);
    const step = wrapperWidth + this.gap;

    if (section === 'personalized') {
      this.personalizedOffset = direction === 'right'
        ? Math.min(this.personalizedOffset + step, maxOffset)
        : Math.max(this.personalizedOffset - step, 0);
    } else {
      this.popularOffset = direction === 'right'
        ? Math.min(this.popularOffset + step, maxOffset)
        : Math.max(this.popularOffset - step, 0);
    }

    this.updateScrollButtons(section);
  }

  getTransform(section: 'personalized' | 'popular'): string {
    const offset = section === 'personalized' ? this.personalizedOffset : this.popularOffset;
    return `translateX(-${offset}px)`;
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
        this.personalizedOffset = 0;
        this.updateScrollButtons('personalized');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Personalized error:', err)
    });
  }

  private loadPopular(): void {
    this.service.getPopular(10).subscribe({
      next: (data) => {
        this.popularItems = data;
        this.updateScrollButtons('popular');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Popular error:', err)
    });
  }

  private updateScrollButtons(section: 'personalized' | 'popular'): void {
    setTimeout(() => {
      const wrapper = section === 'personalized' ? this.personalizedWrapper : this.popularWrapper;
      if (!wrapper) return;

      const wrapperWidth = wrapper.nativeElement.offsetWidth;
      const items = section === 'personalized' ? this.personalizedItems : this.popularItems;
      const cardW = (wrapperWidth + this.gap) / this.visibleCount;
      const totalWidth = items.length * cardW - this.gap;
      const offset = section === 'personalized' ? this.personalizedOffset : this.popularOffset;

      if (section === 'personalized') {
        this.canScrollPersonalizedLeft = offset > 0;
        this.canScrollPersonalizedRight = items.length > this.visibleCount && offset < totalWidth - wrapperWidth - 1;
      } else {
        this.canScrollPopularLeft = offset > 0;
        this.canScrollPopularRight = items.length > this.visibleCount && offset < totalWidth - wrapperWidth - 1;
      }
      this.cdr.detectChanges();
    });
  }
}