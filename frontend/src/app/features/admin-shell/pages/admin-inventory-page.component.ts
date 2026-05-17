import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type {
  InventoryMovementPage,
  InventoryMovementType,
  InventoryRecord,
} from '../../../core/models/inventory.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-inventory-page',
  standalone: true,
  imports: [DatePipe],
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
  readonly movementType = signal<InventoryMovementType | ''>('');
  readonly movementProductId = signal('');
  readonly movementDate = signal('');
  readonly movementLoading = signal(false);
  readonly movementPage = signal<InventoryMovementPage>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });

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

  readonly movementProducts = computed(() => {
    const byId = new Map<string, string>();
    for (const item of this.inventory()) {
      byId.set(item.productId, item.productName);
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });

  readonly movements = computed(() => this.movementPage().content);

  constructor() {
    void this.loadMovements();
  }

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

  async loadMovements(page = 0): Promise<void> {
    this.movementLoading.set(true);
    try {
      const result = await this.inventoryService.listMovements({
        type: this.movementType(),
        productId: this.movementProductId(),
        date: this.movementDate(),
        page,
        size: this.movementPage().size,
      });
      this.movementPage.set(result);
    } finally {
      this.movementLoading.set(false);
    }
  }

  setMovementType(value: string): void {
    this.movementType.set(this.normalizeMovementType(value));
    void this.loadMovements(0);
  }

  setMovementProduct(value: string): void {
    this.movementProductId.set(value);
    void this.loadMovements(0);
  }

  setMovementDate(value: string): void {
    this.movementDate.set(value);
    void this.loadMovements(0);
  }

  clearMovementFilters(): void {
    this.movementType.set('');
    this.movementProductId.set('');
    this.movementDate.set('');
    void this.loadMovements(0);
  }

  movementTypeClass(type: InventoryMovementType): string {
    return `admin-pill movement movement--${type.toLowerCase()}`;
  }

  formatMovementQuantity(value: number): string {
    return value > 0 ? `+${value}` : String(value);
  }

  previousMovementPage(): void {
    const page = this.movementPage().page;
    if (page > 0) {
      void this.loadMovements(page - 1);
    }
  }

  nextMovementPage(): void {
    const page = this.movementPage();
    if (page.page + 1 < page.totalPages) {
      void this.loadMovements(page.page + 1);
    }
  }

  async downloadMovementsExcel(): Promise<void> {
    const rows = await this.loadAllMovementsForExport();
    const html = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Variante</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Antes</th>
            <th>Despues</th>
            <th>Usuario</th>
            <th>Razon</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${this.escapeHtml(row.createdAt)}</td>
              <td>${this.escapeHtml(row.productName)}</td>
              <td>${this.escapeHtml(row.variantName)}</td>
              <td>${this.escapeHtml(row.type)}</td>
              <td>${this.escapeHtml(this.formatMovementQuantity(row.quantityChange))}</td>
              <td>${row.stockBefore}</td>
              <td>${row.stockAfter}</td>
              <td>${this.escapeHtml(row.userName)}</td>
              <td>${this.escapeHtml(row.reason)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-inventario-${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  setQuery(v: string): void {
    this.query.set(v);
  }

  toggleLowStock(): void {
    this.lowStockOnly.update((value) => !value);
  }

  private normalizeMovementType(value: string): InventoryMovementType | '' {
    return ['SALE', 'RESTOCK', 'ADJUSTMENT', 'ENTRY'].includes(value)
      ? (value as InventoryMovementType)
      : '';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async loadAllMovementsForExport(): Promise<InventoryMovementPage['content']> {
    const first = await this.inventoryService.listMovements({
      type: this.movementType(),
      productId: this.movementProductId(),
      date: this.movementDate(),
      page: 0,
      size: 100,
    });

    const rows = [...first.content];
    for (let page = 1; page < first.totalPages; page += 1) {
      const next = await this.inventoryService.listMovements({
        type: this.movementType(),
        productId: this.movementProductId(),
        date: this.movementDate(),
        page,
        size: 100,
      });
      rows.push(...next.content);
    }
    return rows;
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
