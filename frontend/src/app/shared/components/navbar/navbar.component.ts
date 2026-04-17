import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartUiService } from '../../../core/services/cart-ui.service';
import { ModalService } from '../../../core/services/modal.service';
import { AppSettingsService, type AppCurrency, type AppLang } from '../../../core/services/app-settings.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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

  readonly menuOpen = signal(false);
  readonly user = this.auth.user;
  readonly wishlistCount = computed(() => this.wishlist.count());
  readonly cartCount = computed(() => this.cart.count());
  readonly lang = this.settings.lang;
  readonly currency = this.settings.currency;

  openLogin(): void {
    this.menuOpen.set(false);
    this.modal.openLogin();
  }

  openRegister(): void {
    this.menuOpen.set(false);
    this.modal.openRegister();
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }

  openCart(): void {
    this.menuOpen.set(false);
    this.cartUi.show();
  }

  setLang(next: AppLang): void {
    this.settings.setLang(next);
  }

  setCurrency(next: AppCurrency): void {
    this.settings.setCurrency(next);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.menuOpen.set(false);
  }
}
