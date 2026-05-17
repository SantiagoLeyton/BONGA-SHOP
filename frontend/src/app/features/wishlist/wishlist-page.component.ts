import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import type { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductBadgeComponent } from '../../shared/components/product-badge/product-badge.component';
import { ProductQuickViewComponent } from '../../shared/components/product-quick-view/product-quick-view.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name';

const MAX_COMPARE = 3;

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe, TranslatePipe, ProductBadgeComponent, ProductQuickViewComponent],
  templateUrl: './wishlist-page.component.html',
  styleUrl: './wishlist-page.component.scss',
})
export class WishlistPageComponent {
  private readonly products = inject(ProductService);
  private readonly wishlist = inject(WishlistService);
  private readonly cart = inject(CartService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  readonly maxCompare = MAX_COMPARE;
  readonly all = toSignal(this.products.getProducts(), { initialValue: [] });
  readonly wishlistLoaded = this.wishlist.loaded;

  readonly sort = signal<SortKey>('recent');
  /** IDs saliendo (animacion de quitar) */
  readonly removingIds = signal<Set<string>>(new Set());
  /** IDs agregando al carrito (loading micro) */
  readonly addingIds = signal<Set<string>>(new Set());
  /** IDs seleccionados para comparar (max 3) */
  readonly selectedIds = signal<string[]>([]);
  readonly compareOpen = signal(false);
  /** Desplazamiento vertical para que la barra de comparar no tape el footer */
  readonly cbarOffset = signal(0);

  readonly items = computed<Product[]>(() => {
    const ids = this.wishlist.list();
    const byId = new Map(this.all().map((p) => [p.id, p]));
    const base = ids
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p));

    const mode = this.sort();
    const list = [...base];
    switch (mode) {
      case 'price-asc':
        return list.sort((a, b) => this.minPrice(a) - this.minPrice(b));
      case 'price-desc':
        return list.sort((a, b) => this.minPrice(b) - this.minPrice(a));
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      case 'recent':
      default:
        return list.reverse();
    }
  });

  readonly count = computed(() => this.items().length);

  readonly selectedCount = computed(() => this.selectedIds().length);

  readonly compareProducts = computed<Product[]>(() => {
    const byId = new Map(this.all().map((p) => [p.id, p]));
    return this.selectedIds()
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p));
  });

  readonly quickViewOpen = signal(false);
  readonly quickViewProduct = signal<Product | undefined>(undefined);
  readonly clearing = signal(false);

  constructor() {
    // Auto-limpieza: si un producto seleccionado deja de estar en favoritos (ej. removed), quitarlo.
    effect(
      () => {
        const validIds = new Set(this.items().map((p) => p.id));
        const current = this.selectedIds();
        const filtered = current.filter((id) => validIds.has(id));
        if (filtered.length !== current.length) {
          this.selectedIds.set(filtered);
        }
        // Si no queda nada seleccionado y el modal esta abierto, cerrarlo.
        if (!filtered.length && this.compareOpen()) {
          this.compareOpen.set(false);
        }
      },
      { allowSignalWrites: true },
    );
  }

  minPrice(product: Product): number {
    return Math.min(...product.variants.map((v) => v.price));
  }

  primaryFlavor(product: Product): string {
    return product.variants[0]?.flavor ?? '';
  }

  nicotineRange(product: Product): string {
    const values = product.variants.map((v) => v.nicotineMg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min} mg` : `${min}-${max} mg`;
  }

  flavorsList(product: Product): string {
    const unique = Array.from(new Set(product.variants.map((v) => v.flavor).filter(Boolean)));
    return unique.join(', ') || '—';
  }

  totalVariants(product: Product): number {
    return product.variants.length;
  }

  inStock(product: Product): boolean {
    return product.variants.some((v) => (v.stock ?? 0) > 0);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SortKey;
    this.sort.set(value);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleSelected(product: Product): void {
    const current = this.selectedIds();
    if (current.includes(product.id)) {
      this.selectedIds.set(current.filter((id) => id !== product.id));
      return;
    }
    if (current.length >= MAX_COMPARE) {
      this.toasts.show(
        `Solo puedes comparar hasta ${MAX_COMPARE} productos a la vez.`,
        'warning',
        'Comparar',
      );
      return;
    }
    this.selectedIds.set([...current, product.id]);
  }

  clearSelection(): void {
    this.selectedIds.set([]);
  }

  openCompare(): void {
    if (this.selectedIds().length < 2) {
      this.toasts.show('Selecciona al menos 2 productos para comparar.', 'info', 'Comparar');
      return;
    }
    this.compareOpen.set(true);
  }

  closeCompare(): void {
    this.compareOpen.set(false);
  }

  async remove(product: Product): Promise<void> {
    if (this.removingIds().has(product.id)) {
      return;
    }

    const next = new Set(this.removingIds());
    next.add(product.id);
    this.removingIds.set(next);

    window.setTimeout(async () => {
      try {
        await this.wishlist.toggle(product.id);
        this.toasts.show('Quitado de favoritos', 'info', 'Favoritos');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo actualizar favoritos.';
        this.toasts.show(message, 'danger', 'Favoritos');
      } finally {
        const current = new Set(this.removingIds());
        current.delete(product.id);
        this.removingIds.set(current);
      }
    }, 280);
  }

  async addToCart(product: Product): Promise<void> {
    if (this.addingIds().has(product.id)) {
      return;
    }
    const variant = product.variants.find((v) => (v.stock ?? 0) > 0) ?? product.variants[0];
    if (!variant) {
      this.toasts.show('Este producto no tiene variantes disponibles.', 'warning', 'Carrito');
      return;
    }

    const current = new Set(this.addingIds());
    current.add(product.id);
    this.addingIds.set(current);

    try {
      await this.cart.add(product.id, variant.id, 1);
      this.toasts.show(`${product.name} agregado al carrito`, 'success', 'Carrito');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar al carrito.';
      this.toasts.show(message, 'danger', 'Carrito');
    } finally {
      const next = new Set(this.addingIds());
      next.delete(product.id);
      this.addingIds.set(next);
    }
  }

  async addToCartFromCompare(product: Product): Promise<void> {
    await this.addToCart(product);
  }

  goToDetail(product: Product): void {
    this.closeCompare();
    void this.router.navigate(['/products', product.slug]);
  }

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
      this.clearSelection();
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

  isRemoving(id: string): boolean {
    return this.removingIds().has(id);
  }

  isAdding(id: string): boolean {
    return this.addingIds().has(id);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.compareOpen()) {
      this.closeCompare();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onScroll(): void {
    this.updateCbarOffset();
  }

  private updateCbarOffset(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const footer = document.querySelector('.footer') as HTMLElement | null;
    if (!footer) {
      if (this.cbarOffset() !== 0) this.cbarOffset.set(0);
      return;
    }
    const rect = footer.getBoundingClientRect();
    const overlap = Math.max(0, window.innerHeight - rect.top);
    const next = Math.round(overlap);
    if (next !== this.cbarOffset()) {
      this.cbarOffset.set(next);
    }
  }
}
