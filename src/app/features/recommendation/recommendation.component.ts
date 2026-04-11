import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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

  personalizedOffset = 0;
  popularOffset = 0;
  canScrollPersonalizedLeft = false;
  canScrollPersonalizedRight = false;
  canScrollPopularLeft = false;
  canScrollPopularRight = false;

  private visibleCount = 5;
  private cardWidth = 240;
  private gap = 20;

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

  @ViewChild('personalizedWrapper') personalizedWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('popularWrapper') popularWrapper!: ElementRef<HTMLDivElement>;

  constructor(
    private service: RecommendationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.service.getPersonalized({ limit: 10 }).subscribe({
      next: (data) => {
        this.personalizedItems = data;
        this.updateScrollButtons('personalized');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Personalized error:', err)
    });

    this.service.getPopular(10).subscribe({
      next: (data) => {
        this.popularItems = data;
        this.updateScrollButtons('popular');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Popular error:', err)
    });
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
      if (direction === 'right') {
        this.personalizedOffset = Math.min(this.personalizedOffset + step, maxOffset);
      } else {
        this.personalizedOffset = Math.max(this.personalizedOffset - step, 0);
      }
    } else {
      if (direction === 'right') {
        this.popularOffset = Math.min(this.popularOffset + step, maxOffset);
      } else {
        this.popularOffset = Math.max(this.popularOffset - step, 0);
      }
    }

    this.updateScrollButtons(section);
  }

  getTransform(section: 'personalized' | 'popular'): string {
    const offset = section === 'personalized' ? this.personalizedOffset : this.popularOffset;
    return `translateX(-${offset}px)`;
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