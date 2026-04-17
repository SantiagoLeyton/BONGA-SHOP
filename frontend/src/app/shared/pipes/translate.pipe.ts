import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService, type AppLang } from '../../core/services/app-settings.service';

type Dict = Record<string, { es: string; en: string }>;

const DICT: Dict = {
  home: { es: 'Inicio', en: 'Home' },
  products: { es: 'Productos', en: 'Products' },
  wishlist: { es: 'Favoritos', en: 'Wishlist' },
  admin: { es: 'Admin', en: 'Admin' },
  cart: { es: 'Carrito', en: 'Cart' },
  login: { es: 'Entrar', en: 'Sign in' },
  register: { es: 'Registro', en: 'Sign up' },
  logout: { es: 'Salir', en: 'Sign out' },
  orders: { es: 'Órdenes', en: 'Orders' },
};

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly settings = inject(AppSettingsService);

  transform(key: string): string {
    const lang: AppLang = this.settings.lang();
    const entry = DICT[key];
    if (!entry) return key;
    return entry[lang] ?? entry.es;
  }
}

