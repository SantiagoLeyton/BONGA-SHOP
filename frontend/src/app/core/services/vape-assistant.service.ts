import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  VapeAssistantPreferences,
  VapeRecommendationItem,
  VapeRecommendationResponse,
} from '../models/vape-assistant.model';

type VapeRecommendationApiItem = {
  productId: number;
  variantId: number;
  productName: string;
  brandName: string;
  flavor: string;
  nicotineLevel: string;
  price: number;
  stock: number;
  reason: string;
};

type VapeRecommendationApiResponse = {
  aiAvailable: boolean;
  message: string;
  recommendations: VapeRecommendationApiItem[];
};

@Injectable({ providedIn: 'root' })
export class VapeAssistantService {
  private readonly http = inject(HttpClient);

  async recommend(preferences: VapeAssistantPreferences): Promise<VapeRecommendationResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<VapeRecommendationApiResponse>(
          `${environment.apiUrl}/ai/vape-recommendations`,
          preferences,
        ),
      );
      return {
        aiAvailable: response.aiAvailable,
        message: response.message,
        recommendations: response.recommendations.map((item) => this.toItem(item)),
      };
    } catch (error) {
      throw this.mapHttpError(error);
    }
  }

  private toItem(item: VapeRecommendationApiItem): VapeRecommendationItem {
    return {
      productId: String(item.productId),
      variantId: String(item.variantId),
      productName: item.productName,
      brandName: item.brandName,
      flavor: item.flavor,
      nicotineLevel: item.nicotineLevel,
      price: Number(item.price),
      stock: Number(item.stock),
      reason: item.reason,
    };
  }

  private mapHttpError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return new Error('Inicia sesión para usar el asistente inteligente.');
      }
      return new Error('El asistente inteligente no está disponible temporalmente.');
    }
    return error instanceof Error ? error : new Error('El asistente inteligente no está disponible temporalmente.');
  }
}
