export type VapeFlavorPreference = 'Frutales' | 'Dulces' | 'Mentolados' | 'Fuertes';
export type VapeIntensityPreference = 'Suave' | 'Media' | 'Fuerte';
export type VapeExperiencePreference = 'Fresca' | 'Dulce' | 'Relajante' | 'Potente';

export interface VapeAssistantPreferences {
  flavors: VapeFlavorPreference[];
  intensity: VapeIntensityPreference;
  experience: VapeExperiencePreference;
}

export interface VapeRecommendationItem {
  productId: string;
  variantId: string;
  productName: string;
  brandName: string;
  flavor: string;
  nicotineLevel: string;
  price: number;
  stock: number;
  reason: string;
}

export interface VapeRecommendationResponse {
  aiAvailable: boolean;
  message: string;
  recommendations: VapeRecommendationItem[];
}
