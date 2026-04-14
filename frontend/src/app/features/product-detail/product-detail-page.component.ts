import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { ProductBadgeComponent } from '../../shared/components/product-badge/product-badge.component';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import { VaporFrameScrubComponent } from '../../shared/components/vapor-frame-scrub/vapor-frame-scrub.component';
import type { ProductVariant } from '../../core/models/product-variant.model';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    ProductBadgeComponent,
    RevealScrollDirective,
    VaporFrameScrubComponent,
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly loading = signal(true);

  readonly product = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      tap(() => this.loading.set(true)),
      switchMap((slug) => this.productService.getProductBySlug(slug)),
      tap(() => this.loading.set(false)),
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
