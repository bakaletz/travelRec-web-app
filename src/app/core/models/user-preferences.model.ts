export interface UserPreferences {
  id: number;
  cultureWeight: number;
  foodWeight: number;
  nightlifeWeight: number;
  natureWeight: number;
  safetyWeight: number;
  budgetWeight: number;
  beachWeight: number;
  architectureWeight: number;
  shoppingWeight: number;
  preferredCityTypes: string[];
  preferredClimateTypes: string[];
}