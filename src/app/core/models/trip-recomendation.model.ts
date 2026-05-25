import { City } from './city.model';

export interface TripRecommendation {
  cities: City[];
  tripScore: number;
  relevanceScore: number;
  coherenceScore: number;
  suggestedDurationDays: number;
  totalDistanceKm: number | null;
  dominantCityType: string | null;
  reason: string | null;
}