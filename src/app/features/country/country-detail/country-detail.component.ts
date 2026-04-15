import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CountryService } from '../../../core/services/country.service';
import { CityService } from '../../../core/services/city-detail.service';
import { AuthService } from '../../../core/services/auth.service';
import { Country } from '../../../core/models/country.model';
import { City } from '../../../core/models/city.model';
import { ContinentLabelPipe } from '../../../shared/pipes/continent-label.pipe';
import { CityCarouselComponent } from '../../../shared/components/city/city-carousel/city-carousel.component';

interface CountryForm {
  name: string;
  code: string;
  continent: string;
  language: string;
  currency: string;
  description: string;
  imageUrl: string;
}

interface CityForm {
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
  selector: 'app-country-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ContinentLabelPipe,
    CityCarouselComponent
  ],
  templateUrl: './country-detail.component.html',
  styleUrls: ['./country-detail.component.scss']
})
export class CountryDetailComponent implements OnInit {

  country: Country | null = null;
  cities: City[] = [];
  loading = true;
  error = false;
  isAdmin = false;

  cityDialogOpen = false;
  citySaving = false;
  cityFormError = '';
  cityForm: CityForm = this.emptyCityForm();

  countryDialogOpen = false;
  countrySaving = false;
  countryFormError = '';
  countryForm: CountryForm = this.emptyCountryForm();

  continentOptions = [
    { label: 'Europe', value: 'EUROPE' },
    { label: 'Asia', value: 'ASIA' },
    { label: 'Europe & Asia', value: 'EUROPE_ASIA' },
    { label: 'North America', value: 'NORTH_AMERICA' },
    { label: 'South America', value: 'SOUTH_AMERICA' },
    { label: 'Africa', value: 'AFRICA' },
    { label: 'Africa & Asia', value: 'AFRICA_ASIA' },
    { label: 'Oceania', value: 'OCEANIA' },
    { label: 'Antarctica', value: 'ANTARCTICA' },
  ];

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

  private continentColors: Record<string, string> = {
    EUROPE: '#2563eb',
    ASIA: '#dc2626',
    EUROPE_ASIA: '#7c3aed',
    NORTH_AMERICA: '#0891b2',
    SOUTH_AMERICA: '#16a34a',
    AFRICA: '#ea580c',
    AFRICA_ASIA: '#ca8a04',
    OCEANIA: '#0d9488',
    ANTARCTICA: '#64748b',
  };

  constructor(
    private route: ActivatedRoute,
    private countryService: CountryService,
    private cityService: CityService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'ADMIN';
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
      this.loadCountry(id);
    });
  }

  getContinentTagStyle(): Record<string, string> {
    const color = this.continentColors[this.country?.continent ?? ''] ?? '#6b7280';
    return {
      color: color,
      'background-color': color + '14',
      'border': `1px solid ${color}30`,
    };
  }

  onAddToTrip(city: City): void {
    console.log('Add to trip:', city.name);
  }

  // ── Country edit dialog ─────────────────────────

  openCountryDialog(): void {
    if (!this.country) return;
    this.countryForm = {
      name: this.country.name,
      code: this.country.code,
      continent: this.country.continent,
      language: this.country.language ?? '',
      currency: this.country.currency ?? '',
      description: this.country.description ?? '',
      imageUrl: this.country.imageUrl ?? '',
    };
    this.countryFormError = '';
    this.countryDialogOpen = true;
  }

  closeCountryDialog(): void {
    this.countryDialogOpen = false;
  }

  submitCountryForm(): void {
    if (!this.countryForm.name.trim() || !this.countryForm.code.trim() || !this.countryForm.continent) {
      this.countryFormError = 'Name, code and continent are required.';
      return;
    }

    this.countrySaving = true;
    this.countryFormError = '';

    this.countryService.update(this.country!.id, this.countryForm).subscribe({
      next: (updated) => {
        this.country = updated;
        this.countrySaving = false;
        this.countryDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.countryFormError = err.error?.message || 'Failed to update country.';
        this.countrySaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── City create dialog ──────────────────────────

  openCityDialog(): void {
    this.cityForm = this.emptyCityForm();
    this.cityFormError = '';
    this.cityDialogOpen = true;
  }

  closeCityDialog(): void {
    this.cityDialogOpen = false;
  }

  submitCityForm(): void {
    if (!this.cityForm.name.trim()) {
      this.cityFormError = 'City name is required.';
      return;
    }
    if (!this.cityForm.cityType) {
      this.cityFormError = 'City type is required.';
      return;
    }
    if (!this.cityForm.climateType) {
      this.cityFormError = 'Climate type is required.';
      return;
    }
    if (this.cityForm.latitude === null || this.cityForm.longitude === null) {
      this.cityFormError = 'Latitude and longitude are required.';
      return;
    }

    this.citySaving = true;
    this.cityFormError = '';

    const payload = {
      ...this.cityForm,
      countryId: this.country!.id,
    };

    this.cityService.create(payload).subscribe({
      next: (created) => {
        this.cities = [...this.cities, created];
        this.citySaving = false;
        this.cityDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cityFormError = err.error?.message || 'Failed to create city.';
        this.citySaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  getScorePercent(key: string): string {
    const val = this.cityForm[key] ?? 0;
    return ((val as number) * 100).toFixed(0);
  }

  // ── Private ─────────────────────────────────────

  private loadCountry(id: number): void {
    this.loading = true;
    this.error = false;
    this.country = null;
    this.cities = [];

    this.countryService.getById(id).subscribe({
      next: (country) => {
        this.country = country;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadCities(id);
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadCities(countryId: number): void {
    this.cityService.getByCountryId(countryId).subscribe({
      next: (cities) => {
        this.cities = cities;
        this.cdr.detectChanges();
      },
      error: () => this.cities = []
    });
  }

  private emptyCountryForm(): CountryForm {
    return {
      name: '',
      code: '',
      continent: '',
      language: '',
      currency: '',
      description: '',
      imageUrl: ''
    };
  }

  private emptyCityForm(): CityForm {
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