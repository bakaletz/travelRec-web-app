import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CityService } from '../../core/services/city-detail.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { City } from '../../core/models/city.model';
import { Recommendation } from '../../core/models/recommendation.model';
import { CityTypeLabelPipe } from '../../shared/pipes/city-type-label.pipe';
import { ClimateTypeLabelPipe } from '../../shared/pipes/climate-type-label.pipe';
import { CityCardComponent } from '../../shared/components/city-card/city-card.component';

interface ScoreEntry {
  label: string;
  icon: string;
  value: number;
}

@Component({
  selector: 'app-city-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CityTypeLabelPipe,
    ClimateTypeLabelPipe,
    CityCardComponent
  ],
  templateUrl: './city-detail.component.html',
  styleUrls: ['./city-detail.component.scss']
})
export class CityDetailComponent implements OnInit {

  city: City | null = null;
  nearbyRecommendations: Recommendation[] = [];
  loading = true;
  error = false;

  private scoreConfig: { key: keyof City; label: string; icon: string }[] = [
    { key: 'cultureScore', label: 'Culture', icon: '🏛️' },
    { key: 'foodScore', label: 'Food', icon: '🍽️' },
    { key: 'nightlifeScore', label: 'Nightlife', icon: '🌙' },
    { key: 'natureScore', label: 'Nature', icon: '🌿' },
    { key: 'safetyScore', label: 'Safety', icon: '🛡️' },
    { key: 'costLevel', label: 'Cost', icon: '💰' },
    { key: 'beachScore', label: 'Beach', icon: '🏖️' },
    { key: 'architectureScore', label: 'Architecture', icon: '🏗️' },
    { key: 'shoppingScore', label: 'Shopping', icon: '🛍️' },
  ];

  private infraConfig: { key: keyof City; label: string; icon: string }[] = [
    { key: 'publicTransportScore', label: 'Public Transport', icon: '🚇' },
    { key: 'walkabilityScore', label: 'Walkability', icon: '🚶' },
  ];

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

  constructor(
    private route: ActivatedRoute,
    private cityService: CityService,
    private recommendationService: RecommendationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (isNaN(id)) {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }
      this.loadCity(id);
    });
  }

  getAllScores(): ScoreEntry[] {
    if (!this.city) return [];
    return this.scoreConfig
      .map(c => ({
        label: c.label,
        icon: c.icon,
        value: this.city![c.key] as number
      }))
      .filter(s => s.value != null)
      .sort((a, b) => b.value - a.value);
  }

  getInfraScores(): ScoreEntry[] {
    if (!this.city) return [];
    return this.infraConfig
      .map(c => ({
        label: c.label,
        icon: c.icon,
        value: this.city![c.key] as number
      }))
      .filter(s => s.value != null);
  }

  formatScore(score: number | null): string {
    if (score === null || score === undefined) return '';
    return (score * 100).toFixed(0) + '%';
  }

  formatPopulation(pop: number | null): string {
    if (!pop) return '';
    if (pop >= 1_000_000) return (pop / 1_000_000).toFixed(1) + 'M';
    if (pop >= 1_000) return (pop / 1_000).toFixed(0) + 'K';
    return pop.toString();
  }

  getScoreColor(value: number): string {
    if (value >= 0.7) return '#16a34a';
    if (value >= 0.4) return '#d97706';
    return '#dc2626';
  }

  getScoreBarWidth(value: number): string {
    return Math.max(value * 100, 2) + '%';
  }

  getScoreBarGradient(value: number): string {
    if (value >= 0.7) return 'linear-gradient(90deg, #22c55e, #16a34a)';
    if (value >= 0.4) return 'linear-gradient(90deg, #fbbf24, #d97706)';
    return 'linear-gradient(90deg, #f87171, #dc2626)';
  }

  getMetaTagStyle(type: 'cityType' | 'climate', value: string): Record<string, string> {
    const colorMap = type === 'cityType' ? this.cityTypeColors : this.climateColors;
    const color = colorMap[value] ?? '#6b7280';
    return {
      color: color,
      'background-color': color + '14',
      'border': `1px solid ${color}30`,
    };
  }

  onAddToTrip(): void {
    if (!this.city) return;
    console.log('Add to trip:', this.city.name);
  }

  onAddToTripFromNearby(city: City): void {
    console.log('Add to trip:', city.name);
  }

  private loadCity(id: number): void {
    this.loading = true;
    this.error = false;
    this.city = null;

    this.cityService.getById(id).subscribe({
      next: (city) => {
        this.city = city;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadNearby(id);
      },
      error: (err) => {
        console.error('Failed to load city:', err);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadNearby(cityId: number): void {
    this.recommendationService.getNearby(cityId, 300, 6).subscribe({
      next: (data) => {
        this.nearbyRecommendations = data;
        this.cdr.detectChanges();
      },
      error: () => this.nearbyRecommendations = []
    });
  }
}