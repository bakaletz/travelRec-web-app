import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, ChangeDetectorRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripRecommendation } from '../../../../core/models/trip-recomendation.model';

@Component({
  selector: 'app-trip-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-carousel.component.html',
  styleUrls: ['./trip-carousel.component.scss']
})
export class TripCarouselComponent implements AfterViewChecked {

  @Input() trips: TripRecommendation[] = [];
  @Input() savingTripIndex: number | null = null;
  @Input() savedTripIndexes = new Set<number>();
  @Input() showMap: ((trip: TripRecommendation) => boolean) | null = null;
  @Input() visibleCards = 4;

  @Output() saveTrip = new EventEmitter<{ trip: TripRecommendation; index: number }>();
  @Output() openMap = new EventEmitter<TripRecommendation>();

  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;

  offset = 0;
  canScrollLeft = false;
  canScrollRight = false;

  private gap = 20;
  private prevCount = 0;
  private needsButtonUpdate = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewChecked(): void {
    if (this.trips.length !== this.prevCount) {
      this.prevCount = this.trips.length;
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

  canShowMap(trip: TripRecommendation): boolean {
    return this.showMap ? this.showMap(trip) : false;
  }

  scroll(direction: 'left' | 'right'): void {
    if (!this.wrapper) return;

    const wrapperWidth = this.wrapper.nativeElement.offsetWidth;
    const cardW = (wrapperWidth + this.gap) / this.visibleCards;
    const totalWidth = this.trips.length * cardW - this.gap;
    const maxOffset = Math.max(0, totalWidth - wrapperWidth);
    const step = wrapperWidth + this.gap;

    this.offset = direction === 'right'
      ? Math.min(this.offset + step, maxOffset)
      : Math.max(this.offset - step, 0);

    this.needsButtonUpdate = true;
  }

  onSaveTrip(trip: TripRecommendation, index: number): void {
    this.saveTrip.emit({ trip, index });
  }

  onOpenMap(trip: TripRecommendation): void {
    this.openMap.emit(trip);
  }

  private recalcButtons(): boolean {
    if (!this.wrapper) return false;

    const wrapperWidth = this.wrapper.nativeElement.offsetWidth;
    const cardW = (wrapperWidth + this.gap) / this.visibleCards;
    const totalWidth = this.trips.length * cardW - this.gap;

    const newLeft = this.offset > 0;
    const newRight = this.trips.length > this.visibleCards
      && this.offset < totalWidth - wrapperWidth - 1;

    if (newLeft !== this.canScrollLeft || newRight !== this.canScrollRight) {
      this.canScrollLeft = newLeft;
      this.canScrollRight = newRight;
      return true;
    }
    return false;
  }
}