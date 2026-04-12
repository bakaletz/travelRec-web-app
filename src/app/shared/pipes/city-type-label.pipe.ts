import { Pipe, PipeTransform } from '@angular/core';

const CITY_TYPE_LABELS: Record<string, string> = {
  MEGAPOLIS: 'Megapolis',
  LARGE_CITY: 'Large City',
  MEDIUM_CITY: 'Medium City',
  SMALL_TOWN: 'Small Town',
  RESORT: 'Resort',
};

@Pipe({ name: 'cityTypeLabel', standalone: true })
export class CityTypeLabelPipe implements PipeTransform {
  transform(value: string): string {
    return CITY_TYPE_LABELS[value] ?? value;
  }
}