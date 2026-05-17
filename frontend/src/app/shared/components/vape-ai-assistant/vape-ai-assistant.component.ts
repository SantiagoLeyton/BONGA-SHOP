import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VapeAssistantService } from '../../../core/services/vape-assistant.service';
import type {
  VapeAssistantPreferences,
  VapeExperiencePreference,
  VapeFlavorPreference,
  VapeIntensityPreference,
  VapeRecommendationResponse,
} from '../../../core/models/vape-assistant.model';

type Step = 0 | 1 | 2 | 3;

@Component({
  selector: 'app-vape-ai-assistant',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './vape-ai-assistant.component.html',
  styleUrl: './vape-ai-assistant.component.scss',
})
export class VapeAiAssistantComponent {
  private readonly auth = inject(AuthService);
  private readonly assistant = inject(VapeAssistantService);

  readonly isAuthed = this.auth.isAuthed;
  readonly open = signal(false);
  readonly step = signal<Step>(0);
  readonly selectedFlavors = signal<VapeFlavorPreference[]>([]);
  readonly selectedIntensity = signal<VapeIntensityPreference | null>(null);
  readonly selectedExperience = signal<VapeExperiencePreference | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly result = signal<VapeRecommendationResponse | null>(null);

  readonly flavorOptions: VapeFlavorPreference[] = ['Frutales', 'Dulces', 'Mentolados', 'Fuertes'];
  readonly intensityOptions: VapeIntensityPreference[] = ['Suave', 'Media', 'Fuerte'];
  readonly experienceOptions: VapeExperiencePreference[] = ['Fresca', 'Dulce', 'Relajante', 'Potente'];

  readonly progress = computed(() => {
    if (this.result()) return 100;
    return Math.round((this.step() / 3) * 100);
  });

  toggleOpen(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  start(): void {
    this.step.set(1);
    this.error.set('');
  }

  toggleFlavor(option: VapeFlavorPreference): void {
    this.selectedFlavors.update((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  chooseIntensity(option: VapeIntensityPreference): void {
    this.selectedIntensity.set(option);
  }

  chooseExperience(option: VapeExperiencePreference): void {
    this.selectedExperience.set(option);
  }

  next(): void {
    if (this.step() === 1 && !this.selectedFlavors().length) {
      this.error.set('Elige al menos un perfil de sabor.');
      return;
    }
    if (this.step() === 2 && !this.selectedIntensity()) {
      this.error.set('Selecciona la intensidad que prefieres.');
      return;
    }
    this.error.set('');
    this.step.update((value) => Math.min(3, value + 1) as Step);
  }

  back(): void {
    this.error.set('');
    this.step.update((value) => Math.max(0, value - 1) as Step);
  }

  async submit(): Promise<void> {
    if (!this.selectedExperience()) {
      this.error.set('Selecciona el tipo de experiencia.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      const response = await this.assistant.recommend(this.preferences());
      this.result.set(response);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'El asistente inteligente no está disponible temporalmente.');
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.step.set(0);
    this.selectedFlavors.set([]);
    this.selectedIntensity.set(null);
    this.selectedExperience.set(null);
    this.result.set(null);
    this.error.set('');
  }

  isFlavorSelected(option: VapeFlavorPreference): boolean {
    return this.selectedFlavors().includes(option);
  }

  productLink(): string[] {
    return ['/products'];
  }

  private preferences(): VapeAssistantPreferences {
    return {
      flavors: this.selectedFlavors(),
      intensity: this.selectedIntensity() ?? 'Media',
      experience: this.selectedExperience() ?? 'Fresca',
    };
  }
}
