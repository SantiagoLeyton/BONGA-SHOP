import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly settings = inject(AppSettingsService); // se conserva para refresco reactivo

  transform(value: number): string {
    this.settings.currency();
    const currency = 'COP';
    const locale = 'es-CO';
    const normalized = Number.isFinite(value) ? value : 0;
    const fractionDigits = 0;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(normalized);
    } catch {
      return `${normalized.toFixed(fractionDigits)} ${currency}`;
    }
  }
}

