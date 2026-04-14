import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';
import type { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductQuickViewComponent } from '../../shared/components/product-quick-view/product-quick-view.component';
import { ToastService } from '../../core/services/toast.service';

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

  readonly items = computed(() => {
    const ids = new Set(this.wishlist.list());
    return this.all().filter((p) => ids.has(p.id));
  });

  readonly quickViewOpen = signal(false);
  readonly quickViewProduct = signal<Product | undefined>(undefined);

  clear(): void {
    this.wishlist.clear();
    this.toasts.show('Favoritos limpiados', 'info', 'Favoritos');
  }

  openQuickView(p: Product): void {
    this.quickViewProduct.set(p);
    this.quickViewOpen.set(true);
  }

  closeQuickView(): void {
    this.quickViewOpen.set(false);
  }
}

