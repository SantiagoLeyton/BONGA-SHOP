import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly currency = inject(CurrencyService);

  transform(value: number): string {
    this.currency.currency();
    return this.currency.format(value);
  }
}
