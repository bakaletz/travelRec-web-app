import { Pipe, PipeTransform } from '@angular/core';
import { Trip, TripStatus } from '../../core/models/trip.model';

@Pipe({
  name: 'filterByStatus',
  standalone: true
})
export class FilterByStatusPipe implements PipeTransform {
  transform(trips: Trip[], status: TripStatus | 'ALL'): Trip[] {
    if (!trips || status === 'ALL') return trips;
    return trips.filter(t => t.status === status);
  }
}