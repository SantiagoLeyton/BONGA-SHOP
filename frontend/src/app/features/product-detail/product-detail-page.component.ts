import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import type { Product } from '../../core/models/product.model';
import type { ProductVariant } from '../../core/models/product-variant.model';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CartUiService } from '../../core/services/cart-ui.service';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { flyToCart } from '../../shared/animation/fly-to-cart';
import { ProductBadgeComponent } from '../../shared/components/product-badge/product-badge.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { VaporFrameScrubComponent } from '../../shared/components/vapor-frame-scrub/vapor-frame-scrub.component';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    AppCurrencyPipe,
    ProductBadgeComponent,
    RevealScrollDirective,
    VaporFrameScrubComponent,
    ProductCardComponent,
    TranslatePipe,
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly wishlist = inject(WishlistService);
  private readonly toasts = inject(ToastService);
  private readonly cart = inject(CartService);
  private readonly cartUi = inject(CartUiService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly loading = signal(true);
  readonly tab = signal<'details' | 'specs' | 'shipping'>('details');

  readonly product = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      tap(() => this.loading.set(true)),
      switchMap((slug) => this.productService.getProductBySlug(slug)),
      tap(() => this.loading.set(false)),
    ),
    { initialValue: undefined },
  );

  readonly allProducts = toSignal(this.productService.getProducts(), { initialValue: [] });

  private readonly selectedVariantId = signal<string | null>(null);

  readonly selectedVariant = computed<ProductVariant | undefined>(() => {
    const product = this.product();
    const id = this.selectedVariantId();
    if (!product?.variants?.length) {
      return undefined;
    }
    if (!id) {
      return product.variants[0];
    }
    return product.variants.find((variant) => variant.id === id) ?? product.variants[0];
  });

  readonly wished = computed(() => {
    const product = this.product();
    return product ? this.wishlist.has(product.id) : false;
  });

  readonly related = computed<Product[]>(() => {
    const product = this.product();
    if (!product) return [];
    const list = this.allProducts().filter((item) => item.id !== product.id);
    const sameBrand = list.filter((item) => item.brand?.id === product.brand?.id);
    const featured = list.filter((item) => item.featured);
    const pool = [...sameBrand, ...featured];
    const unique = new Map<string, Product>();
    for (const item of pool) unique.set(item.id, item);
    return [...unique.values()].slice(0, 6);
  });

  constructor() {
    effect(() => {
      const product = this.product();
      if (product?.variants?.length) {
        this.selectedVariantId.set(product.variants[0].id);
      } else {
        this.selectedVariantId.set(null);
      }
    });

    effect(() => {
      const product = this.product();
      if (!product) return;
      this.title.setTitle(`${product.name} · BONGA SHOP`);
      this.meta.updateTag({ name: 'description', content: product.description });
      this.meta.updateTag({ property: 'og:title', content: `${product.name} · BONGA SHOP` });
      this.meta.updateTag({ property: 'og:description', content: product.description });
      this.meta.updateTag({ property: 'og:type', content: 'product' });
      this.meta.updateTag({ property: 'og:image', content: product.imageUrl });
    });
  }

  pickVariant(id: string): void {
    this.selectedVariantId.set(id);
  }

  async toggleWish(): Promise<void> {
    const product = this.product();
    if (!product) return;

    if (!this.auth.isAuthed()) {
      this.promptLogin('guardar favoritos');
      return;
    }

    try {
      const isOn = await this.wishlist.toggle(product.id);
      this.toasts.show(
        isOn ? 'Guardado en favoritos' : 'Quitado de favoritos',
        isOn ? 'success' : 'info',
        'Favoritos',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar favoritos.';
      this.toasts.show(message, 'danger', 'Favoritos');
    }
  }

  async addToCart(): Promise<void> {
    const product = this.product();
    const variant = this.selectedVariant();
    if (!product || !variant) return;

    if (!this.auth.isAuthed()) {
      this.promptLogin('agregar productos al carrito');
      return;
    }

    if (variant.stock <= 0) {
      this.toasts.show('Este producto está agotado.', 'warning', 'Carrito');
      return;
    }

    try {
      await this.cart.add(product.id, variant.id, 1);
      this.toasts.show(`${product.name} · ${variant.flavor}`, 'success', 'Añadido al carrito');
      flyToCart(product.imageUrl);
      this.cartUi.show();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el carrito.';
      this.toasts.show(message, 'danger', 'Carrito');
    }
  }

  stockLabel(stock: number): string {
    if (stock <= 0) {
      return 'Agotado';
    }
    if (stock <= 5) {
      return `Stock bajo (${stock})`;
    }
    return `En stock (${stock})`;
  }

  private promptLogin(action: string): void {
    this.modal.openLogin();
    this.toasts.show(`Inicia sesión para ${action}.`, 'info', 'Cuenta');
  }
}
