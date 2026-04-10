import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RecommendationService, Recommendation, City } from './recommendation.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

interface ScoreEntry {
  label: string;
  icon: string;
  value: number;
}

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CardModule, ButtonModule],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.scss']
})
export class RecommendationComponent implements OnInit {

  personalizedItems: Recommendation[] = [];
  popularItems: Recommendation[] = [];

  private scoreConfig: { key: keyof City; label: string; icon: string }[] = [
    { key: 'cultureScore', label: 'Culture', icon: 'pi pi-bookmark' },
    { key: 'foodScore', label: 'Food', icon: 'pi pi-shop' },
    { key: 'nightlifeScore', label: 'Nightlife', icon: 'pi pi-moon' },
    { key: 'natureScore', label: 'Nature', icon: 'pi pi-sun' },
    { key: 'safetyScore', label: 'Safety', icon: 'pi pi-shield' },
    { key: 'beachScore', label: 'Beach', icon: 'pi pi-wave-pulse' },
    { key: 'architectureScore', label: 'Architecture', icon: 'pi pi-building' },
    { key: 'shoppingScore', label: 'Shopping', icon: 'pi pi-shopping-bag' },
  ];

  constructor(
    private service: RecommendationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.service.getPersonalized({ limit: 10 }).subscribe({
      next: (data) => {
        this.personalizedItems = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Personalized error:', err)
    });

    this.service.getPopular(10).subscribe({
      next: (data) => {
        this.popularItems = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Popular error:', err)
    });
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