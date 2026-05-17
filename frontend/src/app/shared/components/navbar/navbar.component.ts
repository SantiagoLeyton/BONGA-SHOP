import {
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartUiService } from '../../../core/services/cart-ui.service';
import { ModalService } from '../../../core/services/modal.service';
import {
  AppSettingsService,
  type AppLang,
} from '../../../core/services/app-settings.service';
import { CurrencyService, type AppCurrency } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { scrollWindowToTop } from '../../utils/scroll.util';

/** Umbral de scroll (px) a partir del cual el header toma el modo compacto. */
const SCROLL_THRESHOLD = 18;
/** Umbral a partir del cual el botón "volver arriba" se muestra. */
const TO_TOP_THRESHOLD = 520;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly wishlist = inject(WishlistService);
  private readonly cart = inject(CartService);
  private readonly cartUi = inject(CartUiService);
  private readonly settings = inject(AppSettingsService);
  private readonly currencyService = inject(CurrencyService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly showToTop = signal(false);

  readonly user = this.auth.user;
  readonly isAuthed = this.auth.isAuthed;
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly wishlistCount = computed(() => this.wishlist.count());
  readonly cartCount = computed(() => this.cart.count());
  readonly lang = this.settings.lang;
  readonly currency = this.currencyService.currency;

  /**
   * Iniciales del usuario (para el avatar del chip de cuenta).
   */
  readonly userInitials = computed<string>(() => {
    const name = this.user()?.name?.trim();
    if (!name) return '·';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  });

  constructor() {
    // Cierra el menú móvil automáticamente al navegar entre páginas.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.menuOpen.set(false));

    // Bloquea el scroll del documento cuando el drawer móvil está abierto.
    effect(() => {
      const open = this.menuOpen();
      if (typeof document === 'undefined') return;
      document.body.classList.toggle('is-nav-open', open);
    });
  }

  openLogin(): void {
    this.menuOpen.set(false);
    this.modal.openLogin();
  }

  openRegister(): void {
    this.menuOpen.set(false);
    this.modal.openRegister();
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
    this.auth.logout();
    this.toasts.show('Tu sesión se cerró correctamente.', 'info', 'Hasta pronto');
    await this.router.navigateByUrl('/');
  }

  openCart(): void {
    this.menuOpen.set(false);
    if (!this.isAuthed()) {
      this.modal.openLogin('/cart');
      this.toasts.show('Inicia sesión para ver tu carrito guardado.', 'info', 'Acceso requerido');
      return;
    }
    this.cartUi.show();
  }

  setLang(next: AppLang): void {
    this.settings.setLang(next);
  }

  setCurrency(next: AppCurrency): void {
    this.currencyService.setCurrency(next);
  }

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  scrollToTop(): void {
    scrollWindowToTop();
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:scroll', [])
  @HostListener('window:resize', [])
  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const y = window.scrollY ?? window.pageYOffset ?? 0;
    const nextScrolled = y > SCROLL_THRESHOLD;
    if (this.scrolled() !== nextScrolled) {
      this.scrolled.set(nextScrolled);
    }
    const nextToTop = y > TO_TOP_THRESHOLD;
    if (this.showToTop() !== nextToTop) {
      this.showToTop.set(nextToTop);
    }
  }
}
