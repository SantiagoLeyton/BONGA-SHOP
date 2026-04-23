import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { InventoryRecord } from '../../../core/models/inventory.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-inventory-page',
  standalone: true,
  imports: [],
  templateUrl: './admin-inventory-page.component.html',
  styleUrl: './admin-pages.shared.scss',
})
export class AdminInventoryPageComponent {
  private readonly inventoryService = inject(InventoryService);
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);

  readonly inventory = toSignal(this.inventoryService.listInventory(), { initialValue: [] });

  readonly query = signal('');
  readonly lowStockOnly = signal(false);
  readonly stockDrafts = signal<Record<string, number>>({});
  readonly savingStockId = signal<string | null>(null);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const lowOnly = this.lowStockOnly();
    return this.inventory().filter((item) => {
      if (lowOnly && !item.lowStock) return false;
      if (!q) return true;
      return [item.productName, item.brandName, item.flavor, item.nicotineLevel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  });

  stockValue(item: InventoryRecord): number {
    return this.stockDrafts()[item.variantId] ?? item.stock;
  }

  setStockDraft(variantId: string, value: string): void {
    const parsed = Number(value);
    this.stockDrafts.update((drafts) => ({
      ...drafts,
      [variantId]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }

  async saveStock(item: InventoryRecord): Promise<void> {
    this.savingStockId.set(item.variantId);
    try {
      await this.inventoryService.updateStock(item.variantId, this.stockValue(item));
      this.stockDrafts.update((drafts) => {
        const next = { ...drafts };
        delete next[item.variantId];
        return next;
      });
      this.products.refresh();
      this.toasts.show('Stock actualizado correctamente.', 'success', 'Inventario');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo actualizar el stock.'), 'danger', 'Inventario');
    } finally {
      this.savingStockId.set(null);
    }
  }

  setQuery(v: string): void {
    this.query.set(v);
  }

  toggleLowStock(): void {
    this.lowStockOnly.update((value) => !value);
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
