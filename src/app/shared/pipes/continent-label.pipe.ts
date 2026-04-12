import { Pipe, PipeTransform } from '@angular/core';

const CONTINENT_LABELS: Record<string, string> = {
  EUROPE: 'Europe',
  ASIA: 'Asia',
  EUROPE_ASIA: 'Europe & Asia',
  NORTH_AMERICA: 'North America',
  SOUTH_AMERICA: 'South America',
  AFRICA: 'Africa',
  AFRICA_ASIA: 'Africa & Asia',
  OCEANIA: 'Oceania',
  ANTARCTICA: 'Antarctica',
};

@Pipe({ name: 'continentLabel', standalone: true })
export class ContinentLabelPipe implements PipeTransform {
  transform(value: string): string {
    return CONTINENT_LABELS[value] ?? value;
  }
}