export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AdminRecommendation {
  title: string;
  description: string;
  priority: RecommendationPriority;
}
