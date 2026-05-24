import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, ChangeDetectorRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { City } from '../../../../core/models/city.model';
import { CityCardComponent } from '../city-card/city-card.component';

@Component({
  selector: 'app-city-carousel',
  standalone: true,
  imports: [CommonModule, CityCardComponent],
  templateUrl: './city-carousel.component.html',
  styleUrls: ['./city-carousel.component.scss']
})
export class CityCarouselComponent implements AfterViewChecked {

  @Input() cities: City[] = [];
  @Input() score: ((city: City) => number | null) | null = null;
  @Input() scoreLabel: string = 'match';
  @Input() distance: ((city: City) => number | null) | null = null;
  @Input() visibleCards: number = 5;
  @Output() addToTrip = new EventEmitter<City>();
  @Input() directAdd = false;

  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;

  offset = 0;
  canScrollLeft = false;
  canScrollRight = false;

  private gap = 20;
  private prevCityCount = 0;
  private needsButtonUpdate = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewChecked(): void {
    if (this.cities.length !== this.prevCityCount) {
      this.prevCityCount = this.cities.length;
      this.offset = 0;
      this.needsButtonUpdate = true;
    }

    if (this.needsButtonUpdate && this.wrapper) {
      this.needsButtonUpdate = false;
      const changed = this.recalcButtons();
      if (changed) {
        this.cdr.detectChanges();
      }
    }
  }

  getTransform(): string {
    return `translateX(-${this.offset}px)`;
  }

  getScore(city: City): number | null {
    return this.score ? this.score(city) : null;
  }

  getDistance(city: City): number | null {
    return this.distance ? this.distance(city) : null;
  }

  scroll(direction: 'left' | 'right'): void {
    if (!this.wrapper) return;

    const wrapperWidth = this.wrapper.nativeElement.offsetWidth;
    const cardW = (wrapperWidth + this.gap) / this.visibleCards;
    const totalWidth = this.cities.length * cardW - this.gap;
    const maxOffset = Math.max(0, totalWidth - wrapperWidth);
    const step = wrapperWidth + this.gap;

    this.offset = direction === 'right'
      ? Math.min(this.offset + step, maxOffset)
      : Math.max(this.offset - step, 0);

    this.needsButtonUpdate = true;
  }

  onAddToTrip(city: City): void {
    this.addToTrip.emit(city);
  }

  private recalcButtons(): boolean {
    if (!this.wrapper) return false;

    const wrapperWidth = this.wrapper.nativeElement.offsetWidth;
    const cardW = (wrapperWidth + this.gap) / this.visibleCards;
    const totalWidth = this.cities.length * cardW - this.gap;

    const newLeft = this.offset > 0;
    const newRight = this.cities.length > this.visibleCards
      && this.offset < totalWidth - wrapperWidth - 1;

    if (newLeft !== this.canScrollLeft || newRight !== this.canScrollRight) {
      this.canScrollLeft = newLeft;
      this.canScrollRight = newRight;
      return true;
    }
    return false;
  }
}