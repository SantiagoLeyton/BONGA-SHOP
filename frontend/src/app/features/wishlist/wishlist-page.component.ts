import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductQuickViewComponent } from '../../shared/components/product-quick-view/product-quick-view.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, ProductQuickViewComponent],
  templateUrl: './wishlist-page.component.html',
  styleUrl: './wishlist-page.component.scss',
})
export class WishlistPageComponent {
  private readonly products = inject(ProductService);
  private readonly wishlist = inject(WishlistService);
  private readonly toasts = inject(ToastService);

  readonly all = toSignal(this.products.getProducts(), { initialValue: [] });
  readonly wishlistLoaded = this.wishlist.loaded;

  readonly items = computed(() => {
    const ids = new Set(this.wishlist.list());
    return this.all().filter((product) => ids.has(product.id));
  });

  readonly quickViewOpen = signal(false);
  readonly quickViewProduct = signal<Product | undefined>(undefined);
  readonly clearing = signal(false);

  async clear(): Promise<void> {
    if (!this.items().length || this.clearing()) {
      return;
    }
    if (!window.confirm('Se quitaran todos los productos guardados en favoritos. Quieres continuar?')) {
      return;
    }

    this.clearing.set(true);
    try {
      await this.wishlist.clear();
      this.toasts.show('Favoritos limpiados', 'info', 'Favoritos');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron limpiar los favoritos.';
      this.toasts.show(message, 'danger', 'Favoritos');
    } finally {
      this.clearing.set(false);
    }
  }

  openQuickView(product: Product): void {
    this.quickViewProduct.set(product);
    this.quickViewOpen.set(true);
  }

  closeQuickView(): void {
    this.quickViewOpen.set(false);
  }
}
