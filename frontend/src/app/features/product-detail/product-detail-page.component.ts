import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { CartUiService } from '../../core/services/cart-ui.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductBadgeComponent } from '../../shared/components/product-badge/product-badge.component';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import { VaporFrameScrubComponent } from '../../shared/components/vapor-frame-scrub/vapor-frame-scrub.component';
import type { ProductVariant } from '../../core/models/product-variant.model';
import type { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { flyToCart } from '../../shared/animation/fly-to-cart';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    ProductBadgeComponent,
    RevealScrollDirective,
    VaporFrameScrubComponent,
    ProductCardComponent,
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
    const p = this.product();
    const id = this.selectedVariantId();
    if (!p?.variants?.length) {
      return undefined;
    }
    if (!id) {
      return p.variants[0];
    }
    return p.variants.find((v) => v.id === id) ?? p.variants[0];
  });

  constructor() {
    effect(() => {
      const p = this.product();
      if (p?.variants?.length) {
        this.selectedVariantId.set(p.variants[0].id);
      } else {
        this.selectedVariantId.set(null);
      }
    });

    effect(() => {
      const p = this.product();
      if (!p) return;
      this.title.setTitle(`${p.name} · BONGA SHOP`);
      this.meta.updateTag({ name: 'description', content: p.description });
      this.meta.updateTag({ property: 'og:title', content: `${p.name} · BONGA SHOP` });
      this.meta.updateTag({ property: 'og:description', content: p.description });
      this.meta.updateTag({ property: 'og:type', content: 'product' });
      this.meta.updateTag({ property: 'og:image', content: p.imageUrl });
    });
  }

  pickVariant(id: string): void {
    this.selectedVariantId.set(id);
  }

  wished = computed(() => {
    const p = this.product();
    return p ? this.wishlist.has(p.id) : false;
  });

  toggleWish(): void {
    const p = this.product();
    if (!p) return;
    const isOn = this.wishlist.toggle(p.id);
    this.toasts.show(isOn ? 'Guardado en favoritos' : 'Quitado de favoritos', isOn ? 'success' : 'info', 'Favoritos');
  }

  addToCart(): void {
    const p = this.product();
    const v = this.selectedVariant();
    if (!p || !v) return;
    if (v.stock <= 0) {
      this.toasts.show('Este producto está agotado.', 'warning', 'Carrito');
      return;
    }
    this.cart.add(p.id, v.id, 1);
    this.toasts.show(`${p.name} · ${v.flavor}`, 'success', 'Añadido al carrito');
    flyToCart(p.imageUrl);
    this.cartUi.show();
  }

  readonly related = computed<Product[]>(() => {
    const p = this.product();
    if (!p) return [];
    const list = this.allProducts().filter((x) => x.id !== p.id);
    const sameBrand = list.filter((x) => x.brand?.id === p.brand?.id);
    const featured = list.filter((x) => x.featured);
    const pool = [...sameBrand, ...featured];
    const unique = new Map<string, Product>();
    for (const x of pool) unique.set(x.id, x);
    return [...unique.values()].slice(0, 6);
  });

  stockLabel(stock: number): string {
    if (stock <= 0) {
      return 'Agotado';
    }
    if (stock <= 5) {
      return `Stock bajo (${stock})`;
    }
    return `En stock (${stock})`;
  }
}
