import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { ProductBadgeComponent } from '../../shared/components/product-badge/product-badge.component';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import type { ProductVariant } from '../../core/models/product-variant.model';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ProductBadgeComponent, RevealScrollDirective],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly product = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) => this.productService.getProductBySlug(slug)),
    ),
    { initialValue: undefined },
  );

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
  }

  pickVariant(id: string): void {
    this.selectedVariantId.set(id);
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
}
