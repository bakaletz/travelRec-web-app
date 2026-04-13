import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { City } from '../../../core/models/city.model';
import { CityTypeLabelPipe } from '../../pipes/city-type-label.pipe';
import { ClimateTypeLabelPipe } from '../../pipes/climate-type-label.pipe';

interface ScoreEntry {
  label: string;
  icon: string;
  value: number;
}

@Component({
  selector: 'app-city-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CityTypeLabelPipe,
    ClimateTypeLabelPipe
  ],
  templateUrl: './city-card.component.html',
  styleUrls: ['./city-card.component.scss']
})
export class CityCardComponent {

  @Input() city!: City;
  @Input() score: number | null = null;
  @Input() scoreLabel: string = 'match';
  @Output() addToTrip = new EventEmitter<City>();

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

  getTopScores(): ScoreEntry[] {
    return this.getSortedScores().slice(0, 3);
  }

  getBottomScores(): ScoreEntry[] {
    return this.getSortedScores().slice(-3).reverse();
  }

  formatScore(value: number | null): string {
    if (value === null || value === undefined) return '';
    return (value * 100).toFixed(0) + '%';
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

  onAddToTrip(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToTrip.emit(this.city);
  }

  private getSortedScores(): ScoreEntry[] {
    if (!this.city) return [];
    return this.scoreConfig
      .map(c => ({
        label: c.label,
        icon: c.icon,
        value: this.city[c.key] as number
      }))
      .filter(s => s.value !== null && s.value !== undefined)
      .sort((a, b) => b.value - a.value);
  }
}