import { City } from './city.model';

export interface Recommendation {
  city: City;
  similarityScore: number | null;
  reason: string | null;
  distanceKm: number | null;
}