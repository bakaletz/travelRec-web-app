import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CityService } from '../../core/services/city-detail.service';
import { AuthService } from '../../core/services/auth.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { City } from '../../core/models/city.model';
import { Recommendation } from '../../core/models/recommendation.model';
import { CityTypeLabelPipe } from '../../shared/pipes/city-type-label.pipe';
import { ClimateTypeLabelPipe } from '../../shared/pipes/climate-type-label.pipe';
import { CityCarouselComponent } from '../../shared/components/city/city-carousel/city-carousel.component';
import { AddToTripDialogComponent } from '../../shared/components/add-to-trip-dialog/add-to-trip-dialog.component';

interface ScoreEntry {
  label: string;
  icon: string;
  value: number;
}

interface CityEditForm {
  name: string;
  region: string;
  cityType: string;
  population: number | null;
  climateType: string;
  avgTempSummer: number | null;
  avgTempWinter: number | null;
  latitude: number | null;
  longitude: number | null;
  baseCostLevel: number;
  baseSafetyScore: number;
  baseCultureScore: number;
  baseFoodScore: number;
  baseNightlifeScore: number;
  baseNatureScore: number;
  baseBeachScore: number;
  baseArchitectureScore: number;
  baseShoppingScore: number;
  publicTransportScore: number;
  walkabilityScore: number;
  description: string;
  imageUrl: string;
  [key: string]: string | number | null;
}

@Component({
  selector: 'app-city-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CityTypeLabelPipe,
    ClimateTypeLabelPipe,
    CityCarouselComponent,
    AddToTripDialogComponent
  ],
  templateUrl: './city-detail.component.html',
  styleUrls: ['./city-detail.component.scss']
})
export class CityDetailComponent implements OnInit {

  showTripDialog = false;
  tripDialogCityId: number | null = null;
  tripDialogCityName = '';

  city: City | null = null;
  nearbyRecommendations: Recommendation[] = [];
  similarRecommendations: Recommendation[] = [];
  cityMatchScore: number | null = null;
  loading = true;
  error = false;
  isAdmin = false;
  isLoggedIn = false;

  editDialogOpen = false;
  editSaving = false;
  editFormError = '';
  editForm: CityEditForm = this.emptyEditForm();

  cityTypeOptions = [
    { label: 'Megapolis', value: 'MEGAPOLIS' },
    { label: 'Large City', value: 'LARGE_CITY' },
    { label: 'Medium City', value: 'MEDIUM_CITY' },
    { label: 'Small Town', value: 'SMALL_TOWN' },
    { label: 'Resort', value: 'RESORT' },
  ];

  climateTypeOptions = [
    { label: 'Tropical', value: 'TROPICAL' },
    { label: 'Dry', value: 'DRY' },
    { label: 'Continental', value: 'CONTINENTAL' },
    { label: 'Temperate', value: 'TEMPERATE' },
    { label: 'Mediterranean', value: 'MEDITERRANEAN' },
    { label: 'Polar', value: 'POLAR' },
    { label: 'Oceanic', value: 'OCEANIC' },
  ];

  scoreFields = [
    { key: 'baseCultureScore', label: 'Culture' },
    { key: 'baseFoodScore', label: 'Food' },
    { key: 'baseNightlifeScore', label: 'Nightlife' },
    { key: 'baseNatureScore', label: 'Nature' },
    { key: 'baseSafetyScore', label: 'Safety' },
    { key: 'baseCostLevel', label: 'Cost Level' },
    { key: 'baseBeachScore', label: 'Beach' },
    { key: 'baseArchitectureScore', label: 'Architecture' },
    { key: 'baseShoppingScore', label: 'Shopping' },
    { key: 'publicTransportScore', label: 'Public Transport' },
    { key: 'walkabilityScore', label: 'Walkability' },
  ];

  nearbyScoreFn = (city: City): number | null => {
    const item = this.nearbyRecommendations.find(i => i.city.id === city.id);
    return item ? item.similarityScore : null;
  };

  similarScoreFn = (city: City): number | null => {
    const item = this.similarRecommendations.find(i => i.city.id === city.id);
    return item ? item.similarityScore : null;
  };

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
    private authService: AuthService,
    private recommendationService: RecommendationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'ADMIN';
      this.isLoggedIn = !!user;
      this.cdr.detectChanges();
    });

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

  get nearbyCities(): City[] {
    return this.nearbyRecommendations.map(i => i.city);
  }

  get similarCities(): City[] {
    return this.similarRecommendations.map(i => i.city);
  }

  // ── Edit dialog ─────────────────────────────────

  openEditDialog(): void {
    if (!this.city) return;
    this.editForm = {
      name: this.city.name,
      region: this.city.region ?? '',
      cityType: this.city.cityType,
      population: this.city.population ?? null,
      climateType: this.city.climateType,
      avgTempSummer: this.city.avgTempSummer ?? null,
      avgTempWinter: this.city.avgTempWinter ?? null,
      latitude: this.city.latitude ?? null,
      longitude: this.city.longitude ?? null,
      baseCultureScore: this.city.cultureScore ?? 0.5,
      baseFoodScore: this.city.foodScore ?? 0.5,
      baseNightlifeScore: this.city.nightlifeScore ?? 0.5,
      baseNatureScore: this.city.natureScore ?? 0.5,
      baseSafetyScore: this.city.safetyScore ?? 0.5,
      baseCostLevel: this.city.costLevel ?? 0.5,
      baseBeachScore: this.city.beachScore ?? 0.5,
      baseArchitectureScore: this.city.architectureScore ?? 0.5,
      baseShoppingScore: this.city.shoppingScore ?? 0.5,
      publicTransportScore: this.city.publicTransportScore ?? 0.5,
      walkabilityScore: this.city.walkabilityScore ?? 0.5,
      description: this.city.description ?? '',
      imageUrl: this.city.imageUrl ?? '',
    };
    this.editFormError = '';
    this.editDialogOpen = true;
  }

  closeEditDialog(): void {
    this.editDialogOpen = false;
  }

  submitEditForm(): void {
    if (!this.editForm.name.trim()) {
      this.editFormError = 'City name is required.';
      return;
    }
    if (!this.editForm.cityType) {
      this.editFormError = 'City type is required.';
      return;
    }
    if (!this.editForm.climateType) {
      this.editFormError = 'Climate type is required.';
      return;
    }
    if (this.editForm.latitude === null || this.editForm.longitude === null) {
      this.editFormError = 'Latitude and longitude are required.';
      return;
    }

    this.editSaving = true;
    this.editFormError = '';

    const payload = {
      ...this.editForm,
      countryId: this.city!.countryId,
    };

    this.cityService.update(this.city!.id, payload).subscribe({
      next: (updated) => {
        this.city = updated;
        this.editSaving = false;
        this.editDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.editFormError = err.error?.message || 'Failed to update city.';
        this.editSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  getEditScorePercent(key: string): string {
    const val = this.editForm[key] ?? 0;
    return ((val as number) * 100).toFixed(0);
  }

  // ── Scores ──────────────────────────────────────

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

  nearbyDistanceFn = (city: City): number | null => {
    const item = this.nearbyRecommendations.find(i => i.city.id === city.id);
    return item ? item.distanceKm : null;
  };

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

  getMatchBadgeStyle(): Record<string, string> {
    return {
      'position': 'absolute',
      'bottom': '28px',
      'right': '28px',
      'display': 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
      'padding': '10px 14px',
      'background-color': '#2563eb',
      'border-radius': '12px',
      'box-shadow': '0 4px 14px rgba(37, 99, 235, 0.45)',
      'z-index': '5',
    };
  }

  getMatchValueStyle(): Record<string, string> {
    return {
      'font-size': '20px',
      'font-weight': '700',
      'line-height': '1',
      'color': '#ffffff',
    };
  }

  getMatchLabelStyle(): Record<string, string> {
    return {
      'font-size': '10px',
      'font-weight': '600',
      'text-transform': 'uppercase',
      'letter-spacing': '0.5px',
      'margin-top': '3px',
      'color': 'rgba(255, 255, 255, 0.85)',
    };
  }

  onAddToTrip(): void {
    if (!this.city) return;
    this.tripDialogCityId = this.city.id;
    this.tripDialogCityName = this.city.name;
    this.showTripDialog = true;
  }

  onAddToTripFromNearby(city: City): void {
    this.tripDialogCityId = city.id;
    this.tripDialogCityName = city.name;
    this.showTripDialog = true;
  }

  onTripDialogClose(): void {
    this.showTripDialog = false;
  }

  // ── Private ─────────────────────────────────────

  private loadCity(id: number): void {
    this.loading = true;
    this.error = false;
    this.city = null;
    this.nearbyRecommendations = [];
    this.similarRecommendations = [];
    this.cityMatchScore = null;

    this.cityService.getById(id).subscribe({
      next: (city) => {
        this.city = city;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadNearby(id);
        this.loadSimilar(id);
        if (this.isLoggedIn) {
          this.loadMatch(id);
        }
      },
      error: (err) => {
        console.error('Failed to load city:', err);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadMatch(cityId: number): void {
    this.recommendationService.getMatch(cityId).subscribe({
      next: (data) => {
        this.cityMatchScore = data.similarityScore;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cityMatchScore = null;
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

  private loadSimilar(cityId: number): void {
    this.recommendationService.getSimilar(cityId, 6).subscribe({
      next: (data) => {
        this.similarRecommendations = data;
        this.cdr.detectChanges();
      },
      error: () => this.similarRecommendations = []
    });
  }

  private emptyEditForm(): CityEditForm {
    return {
      name: '',
      region: '',
      cityType: '',
      population: null,
      climateType: '',
      avgTempSummer: null,
      avgTempWinter: null,
      latitude: null,
      longitude: null,
      baseCostLevel: 0.5,
      baseSafetyScore: 0.5,
      baseCultureScore: 0.5,
      baseFoodScore: 0.5,
      baseNightlifeScore: 0.5,
      baseNatureScore: 0.5,
      baseBeachScore: 0.5,
      baseArchitectureScore: 0.5,
      baseShoppingScore: 0.5,
      publicTransportScore: 0.5,
      walkabilityScore: 0.5,
      description: '',
      imageUrl: ''
    };
  }
}