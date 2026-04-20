import { Pipe, PipeTransform } from '@angular/core';

const CLIMATE_LABELS: Record<string, string> = {
  TROPICAL: 'Tropical',
  DRY: 'Dry',
  CONTINENTAL: 'Continental',
  TEMPERATE: 'Temperate',
  MEDITERRANEAN: 'Mediterranean',
  POLAR: 'Polar',
  OCEANIC: 'Oceanic',
};

@Pipe({ name: 'climateTypeLabel', standalone: true })
export class ClimateTypeLabelPipe implements PipeTransform {
  transform(value: string): string {
    return CLIMATE_LABELS[value] ?? value;
  }
}