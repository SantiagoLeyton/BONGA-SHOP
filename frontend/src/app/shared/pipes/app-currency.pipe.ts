import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly settings = inject(AppSettingsService);

  transform(value: number): string {
    const currency = this.settings.currency();
    const locale = this.settings.lang() === 'en' ? 'en-US' : 'es-ES';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }
}

