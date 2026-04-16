import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { UserService } from '../../core/services/user.service';
import { UserPreferences } from '../../core/models/user-preferences.model';

interface PreferenceItem {
  key: string;
  label: string;
  icon: string;
}

interface Tier {
  id: string;
  label: string;
  description: string;
  weight: number;
  color: string;
  items: PreferenceItem[];
}

interface ChipOption {
  value: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit {

  tiers: Tier[] = [];
  loading = true;
  saving = false;
  saved = false;

  cityTypeChips: ChipOption[] = [
    { value: 'MEGAPOLIS', label: 'Megapolis', selected: false },
    { value: 'LARGE_CITY', label: 'Large City', selected: false },
    { value: 'MEDIUM_CITY', label: 'Medium City', selected: false },
    { value: 'SMALL_TOWN', label: 'Small Town', selected: false },
    { value: 'RESORT', label: 'Resort', selected: false },
  ];

  climateChips: ChipOption[] = [
    { value: 'TROPICAL', label: 'Tropical', selected: false },
    { value: 'DRY', label: 'Dry', selected: false },
    { value: 'CONTINENTAL', label: 'Continental', selected: false },
    { value: 'TEMPERATE', label: 'Temperate', selected: false },
    { value: 'MEDITERRANEAN', label: 'Mediterranean', selected: false },
    { value: 'POLAR', label: 'Polar', selected: false },
    { value: 'OCEANIC', label: 'Oceanic', selected: false },
  ];

  private allItems: PreferenceItem[] = [
    { key: 'cultureWeight', label: 'Culture', icon: '🏛️' },
    { key: 'foodWeight', label: 'Food', icon: '🍽️' },
    { key: 'nightlifeWeight', label: 'Nightlife', icon: '🌙' },
    { key: 'natureWeight', label: 'Nature', icon: '🌿' },
    { key: 'safetyWeight', label: 'Safety', icon: '🛡️' },
    { key: 'budgetWeight', label: 'Budget', icon: '💰' },
    { key: 'beachWeight', label: 'Beach', icon: '🏖️' },
    { key: 'architectureWeight', label: 'Architecture', icon: '🏗️' },
    { key: 'shoppingWeight', label: 'Shopping', icon: '🛍️' },
  ];

  private tierConfig = [
    { id: 'must', label: 'Must Have', description: 'Top priority', weight: 1.0, color: '#16a34a' },
    { id: 'important', label: 'Important', description: 'Matters a lot', weight: 0.75, color: '#2563eb' },
    { id: 'nice', label: 'Nice to Have', description: 'Would be good', weight: 0.5, color: '#d97706' },
    { id: 'low', label: 'Low Priority', description: 'Not essential', weight: 0.25, color: '#9ca3af' },
    { id: 'ignore', label: "Don't Care", description: 'Ignore this', weight: 0.0, color: '#dc2626' },
  ];

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initTiers();
    this.loadPreferences();
  }

  get connectedDropLists(): string[] {
    return this.tiers.map(t => 'tier-' + t.id);
  }

  onDrop(event: CdkDragDrop<PreferenceItem[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.saved = false;
  }

  toggleCityType(chip: ChipOption): void {
    chip.selected = !chip.selected;
    this.saved = false;
  }

  toggleClimate(chip: ChipOption): void {
    chip.selected = !chip.selected;
    this.saved = false;
  }

  save(): void {
    this.saving = true;
    this.saved = false;

    const weights: Record<string, number> = {};
    for (const tier of this.tiers) {
      for (const item of tier.items) {
        weights[item.key] = tier.weight;
      }
    }

    const payload: Partial<UserPreferences> = {
      cultureWeight: weights['cultureWeight'] ?? 0.5,
      foodWeight: weights['foodWeight'] ?? 0.5,
      nightlifeWeight: weights['nightlifeWeight'] ?? 0.5,
      natureWeight: weights['natureWeight'] ?? 0.5,
      safetyWeight: weights['safetyWeight'] ?? 0.5,
      budgetWeight: weights['budgetWeight'] ?? 0.5,
      beachWeight: weights['beachWeight'] ?? 0.5,
      architectureWeight: weights['architectureWeight'] ?? 0.5,
      shoppingWeight: weights['shoppingWeight'] ?? 0.5,
      preferredCityTypes: this.cityTypeChips.filter(c => c.selected).map(c => c.value),
      preferredClimateTypes: this.climateChips.filter(c => c.selected).map(c => c.value),
    };

    this.userService.updatePreferences(payload).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initTiers(): void {
    this.tiers = this.tierConfig.map(t => ({ ...t, items: [] }));
  }

  private loadPreferences(): void {
    this.userService.getPreferences().subscribe({
      next: (prefs) => {
        this.distributeToTiers(prefs);
        this.applyCityTypes(prefs.preferredCityTypes ?? []);
        this.applyClimateTypes(prefs.preferredClimateTypes ?? []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tiers[2].items = [...this.allItems];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private distributeToTiers(prefs: UserPreferences): void {
    for (const tier of this.tiers) {
      tier.items = [];
    }

    for (const item of this.allItems) {
      const weight = (prefs as any)[item.key] as number ?? 0.5;
      const tier = this.findTierForWeight(weight);
      tier.items.push({ ...item });
    }
  }

  private findTierForWeight(weight: number): Tier {
    if (weight >= 0.875) return this.tiers[0];
    if (weight >= 0.625) return this.tiers[1];
    if (weight >= 0.375) return this.tiers[2];
    if (weight >= 0.125) return this.tiers[3];
    return this.tiers[4];
  }

  private applyCityTypes(types: string[]): void {
    for (const chip of this.cityTypeChips) {
      chip.selected = types.includes(chip.value);
    }
  }

  private applyClimateTypes(types: string[]): void {
    for (const chip of this.climateChips) {
      chip.selected = types.includes(chip.value);
    }
  }
}