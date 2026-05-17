import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AdminRecommendation } from '../models/admin-recommendation.model';

@Injectable({ providedIn: 'root' })
export class AdminRecommendationService {
  private readonly http = inject(HttpClient);

  async list(): Promise<AdminRecommendation[]> {
    try {
      return await firstValueFrom(
        this.http.get<AdminRecommendation[]>(`${environment.apiUrl}/admin/recommendations`),
      );
    } catch {
      return [
        {
          title: 'Asistente operativo no disponible',
          description:
            'El asistente operativo no está disponible temporalmente. Verifica que Ollama esté activo y vuelve a recalcular.',
          priority: 'LOW',
        },
      ];
    }
  }
}
