import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ChangeDetectorRef,
  DestroyRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CityService } from '../../../core/services/city-detail.service';
import { CountryService } from '../../../core/services/country.service';
import { City } from '../../../core/models/city.model';
import { Country } from '../../../core/models/country.model';

type SearchItem =
  | { kind: 'city'; id: number; name: string; subtitle: string; imageUrl: string | null }
  | { kind: 'country'; id: number; name: string; subtitle: string; imageUrl: string | null; code: string };

const MAX_PER_GROUP = 5;

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-autocomplete.component.html',
  styleUrls: ['./search-autocomplete.component.scss']
})
export class SearchAutocompleteComponent implements OnInit {

  @ViewChild('input') inputEl!: ElementRef<HTMLInputElement>;

  query = '';
  open = signal(false);
  loading = signal(false);
  cityResults = signal<SearchItem[]>([]);
  countryResults = signal<SearchItem[]>([]);
  activeIndex = signal<number>(-1);

  private queryStream = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  constructor(
    private host: ElementRef<HTMLElement>,
    private router: Router,
    private cityService: CityService,
    private countryService: CountryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.queryStream
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q => {
          const trimmed = q.trim();
          if (trimmed.length < 2) {
            this.loading.set(false);
            return of({ cities: [] as City[], countries: [] as Country[] });
          }
          this.loading.set(true);
          return forkJoin({
            cities: this.cityService.search(trimmed).pipe(catchError(() => of([] as City[]))),
            countries: this.countryService.search(trimmed).pipe(catchError(() => of([] as Country[])))
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ cities, countries }) => {
        this.cityResults.set(
          cities.slice(0, MAX_PER_GROUP).map<SearchItem>(c => ({
            kind: 'city',
            id: c.id,
            name: c.name,
            subtitle: c.countryName || c.region || '',
            imageUrl: c.imageUrl || null
          }))
        );
        this.countryResults.set(
          countries.slice(0, MAX_PER_GROUP).map<SearchItem>(c => ({
            kind: 'country',
            id: c.id,
            name: c.name,
            subtitle: this.formatContinent(c.continent),
            imageUrl: c.imageUrl || null,
            code: c.code
          }))
        );
        this.activeIndex.set(-1);
        this.loading.set(false);
        this.cdr.detectChanges();
      });
  }

  onInput(value: string): void {
    this.query = value;
    this.open.set(true);
    this.queryStream.next(value);
  }

  onFocus(): void {
    if (this.query.trim().length >= 2) {
      this.open.set(true);
    }
  }

  clear(): void {
    this.query = '';
    this.cityResults.set([]);
    this.countryResults.set([]);
    this.activeIndex.set(-1);
    this.open.set(false);
    this.inputEl?.nativeElement.focus();
  }

  get flatItems(): SearchItem[] {
    return [...this.cityResults(), ...this.countryResults()];
  }

  get hasResults(): boolean {
    return this.flatItems.length > 0;
  }

  get showNoResults(): boolean {
    return (
      this.open() &&
      !this.loading() &&
      this.query.trim().length >= 2 &&
      !this.hasResults
    );
  }

  get showHint(): boolean {
    return this.open() && this.query.trim().length < 2;
  }

  itemIndex(item: SearchItem): number {
    return this.flatItems.findIndex(i => i.kind === item.kind && i.id === item.id);
  }

  isActive(item: SearchItem): boolean {
    return this.itemIndex(item) === this.activeIndex();
  }

  select(item: SearchItem): void {
    if (item.kind === 'city') {
      this.router.navigate(['/cities', item.id]);
    } else {
      this.router.navigate(['/countries', item.id]);
    }
    this.query = '';
    this.open.set(false);
    this.cityResults.set([]);
    this.countryResults.set([]);
    this.activeIndex.set(-1);
    this.inputEl?.nativeElement.blur();
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.flatItems;

    if (event.key === 'ArrowDown') {
      if (!this.open()) this.open.set(true);
      if (items.length > 0) {
        event.preventDefault();
        const next = (this.activeIndex() + 1) % items.length;
        this.activeIndex.set(next);
      }
    } else if (event.key === 'ArrowUp') {
      if (items.length > 0) {
        event.preventDefault();
        const prev = this.activeIndex() <= 0 ? items.length - 1 : this.activeIndex() - 1;
        this.activeIndex.set(prev);
      }
    } else if (event.key === 'Enter') {
      const idx = this.activeIndex();
      if (idx >= 0 && idx < items.length) {
        event.preventDefault();
        this.select(items[idx]);
      }
    } else if (event.key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.open.set(false);
        this.inputEl?.nativeElement.blur();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  getInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  private formatContinent(continent: string): string {
    if (!continent) return '';
    return continent
      .toLowerCase()
      .split('_')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
}