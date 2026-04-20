export type TripStatus = 'PLANNED' | 'COMPLETED' | 'RATED' | 'CANCELLED';

export interface TripCity {
  id: number;
  cityId: number;
  cityName: string;
  countryName: string;
  imageUrl: string;
  visitOrder: number;
  arrivalDate: string | null;
  departureDate: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceFromPrevious: number | null;
  suboptimalOrder: boolean | null;
}

export interface Trip {
  id: number;
  name: string;
  status: TripStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  cities: TripCity[];
  totalDistance: number | null;
}

export interface TripRequest {
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface AddCityToTripRequest {
  cityId: number;
  visitOrder: number;
  arrivalDate?: string;
  departureDate?: string;
}