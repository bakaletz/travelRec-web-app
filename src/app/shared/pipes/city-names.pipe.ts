import { Pipe, PipeTransform } from '@angular/core';
import { TripCity } from '../../core/models/trip.model';

@Pipe({
  name: 'cityNames',
  standalone: true
})
export class CityNamesPipe implements PipeTransform {
  transform(cities: TripCity[]): string {
    if (!cities || cities.length === 0) return '';
    return cities.map(c => c.cityName).join(' → ');
  }
}