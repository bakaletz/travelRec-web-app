import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecommendationService } from '../../core/services/recommendation.service';
import { Recommendation } from '../../core/models/recommendation.model';
import { RecommendationFilters } from '../../core/models/recommendation-filter.model';
import { City } from '../../core/models/city.model';
import { MultiSelectModule } from 'primeng/multiselect';
import { CityTypeLabelPipe } from '../../shared/pipes/city-type-label.pipe';
import { ClimateTypeLabelPipe } from '../../shared/pipes/climate-type-label.pipe';

interface ScoreEntry {
  label: string;
  icon: string;
  value: number;
}

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
    CityTypeLabelPipe,
    ClimateTypeLabelPipe
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

  private cityTypeColors: Record<string, string> = {
    MEGAPOLIS: '#7c3aed',
    LARGE_CITY: '#2563eb',
    MEDIUM_CITY: '#0891b2',
    SMALL_TOWN: '#16a34a',
    RESORT: '#ea580c',
  };

  private climateColors: Record<string, string> = {
    TROPICAL: '#ea580c',
    DRY: '#ca8a04',
    CONTINENTAL: '#2563eb',
    TEMPERATE: '#16a34a',
    MEDITERRANEAN: '#0891b2',
    POLAR: '#64748b',
    OCEANIC: '#7c3aed',
  };

  private scoreConfig: { key: keyof City; label: string; icon: string }[] = [
    { key: 'cultureScore', label: 'Culture', icon: '🏛️' },
    { key: 'foodScore', label: 'Food', icon: '🍽️' },
    { key: 'nightlifeScore', label: 'Nightlife', icon: '🌙' },
    { key: 'natureScore', label: 'Nature', icon: '🌿' },
    { key: 'safetyScore', label: 'Safety', icon: '🛡️' },
    { key: 'beachScore', label: 'Beach', icon: '🏖️' },
    { key: 'architectureScore', label: 'Architecture', icon: '🏗️' },
    { key: 'shoppingScore', label: 'Shopping', icon: '🛍️' },
  ];

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

  getTopScores(city: City): ScoreEntry[] {
    return this.getSortedScores(city).slice(0, 3);
  }

  getBottomScores(city: City): ScoreEntry[] {
    return this.getSortedScores(city).slice(-3).reverse();
  }

  formatScore(score: number | null): string {
    if (score === null) return '';
    return (score * 100).toFixed(0) + '%';
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

  getMetaTagStyle(type: 'cityType' | 'continent' | 'climate', value: string): Record<string, string> {
    const colorMap = type === 'cityType' ? this.cityTypeColors : this.climateColors;
    const color = colorMap[value] ?? '#6b7280';
    return {
      color: color,
      'background-color': color + '14',
      'border': `1px solid ${color}30`,
    };
  }

  onAddToTrip(event: Event, city: City): void {
    event.preventDefault();
    event.stopPropagation();
    // TODO: open trip selection dropdown
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

  private getSortedScores(city: City): ScoreEntry[] {
    return this.scoreConfig
      .map(c => ({
        label: c.label,
        icon: c.icon,
        value: city[c.key] as number
      }))
      .filter(s => s.value !== null && s.value !== undefined)
      .sort((a, b) => b.value - a.value);
  }
}