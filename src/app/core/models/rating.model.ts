export interface RatingResponse {
  id: number;
  tripId: number;
  cityId: number;
  cityName: string;
  overallScore: number;
  cultureRating: number | null;
  foodRating: number | null;
  nightlifeRating: number | null;
  natureRating: number | null;
  safetyRating: number | null;
  costRating: number | null;
  beachRating: number | null;
  architectureRating: number | null;
  shoppingRating: number | null;
  feedback: string | null;
  detailed: boolean;
  createdAt: string;
}

export interface QuickRatingRequest {
  tripId: number;
  cityId: number;
  overallScore: number;
  feedback?: string;
}

export interface DetailedRatingRequest {
  tripId: number;
  cityId: number;
  overallScore: number;
  cultureRating?: number;
  foodRating?: number;
  nightlifeRating?: number;
  natureRating?: number;
  safetyRating?: number;
  costRating?: number;
  beachRating?: number;
  architectureRating?: number;
  shoppingRating?: number;
  feedback?: string;
}

export interface UserCityRating {
  ratingCount: number;
  overallScore: number | null;
  cultureRating: number | null;
  foodRating: number | null;
  nightlifeRating: number | null;
  natureRating: number | null;
  safetyRating: number | null;
  costRating: number | null;
  beachRating: number | null;
  architectureRating: number | null;
  shoppingRating: number | null;
}