import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CountryService } from '../../core/services/country.service';
import { AuthService } from '../../core/services/auth.service';
import { Country } from '../../core/models/country.model';

interface CountryForm {
  name: string;
  code: string;
  continent: string;
  language: string;
  currency: string;
  description: string;
  imageUrl: string;
}

@Component({
  selector: 'app-countries',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './countries.component.html',
  styleUrls: ['./countries.component.scss']
})
export class CountriesComponent implements OnInit {

  countries: Country[] = [];
  loading = true;
  isAdmin = false;

  dialogOpen = false;
  saving = false;
  formError = '';

  form: CountryForm = this.emptyForm();

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

  constructor(
    private countryService: CountryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'ADMIN';
      this.cdr.detectChanges();
    });

    this.loadCountries();
  }

  openDialog(): void {
    this.form = this.emptyForm();
    this.formError = '';
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  submitForm(): void {
    if (!this.form.name.trim() || !this.form.code.trim() || !this.form.continent) {
      this.formError = 'Name, code and continent are required.';
      return;
    }

    this.saving = true;
    this.formError = '';

    this.countryService.create(this.form).subscribe({
      next: (created) => {
        this.countries = [...this.countries, created];
        this.saving = false;
        this.dialogOpen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.formError = err.error?.message || 'Failed to create country.';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadCountries(): void {
    this.countryService.getAll().subscribe({
      next: (data) => {
        this.countries = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private emptyForm(): CountryForm {
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
}