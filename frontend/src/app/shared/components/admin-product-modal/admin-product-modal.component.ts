import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Product } from '../../../core/models/product.model';
import type { ProductVariant } from '../../../core/models/product-variant.model';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

@Component({
  selector: 'app-admin-product-modal',
  standalone: true,
  imports: [ModalShellComponent, ReactiveFormsModule],
  templateUrl: './admin-product-modal.component.html',
  styleUrl: './admin-product-modal.component.scss',
})
export class AdminProductModalComponent {
  @Input({ required: true }) isOpen = false;
  @Input() product: Product | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Product>();

  readonly filePreview = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    brandName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    brandSlug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    featured: new FormControl(false, { nonNullable: true }),
  });

  readonly variantsText = new FormControl<string>('', { nonNullable: true });

  readonly canSave = computed(() => this.form.valid);

  ngOnChanges(): void {
    const p = this.product;
    if (!p) {
      this.form.reset({
        name: '',
        slug: '',
        brandName: '',
        brandSlug: '',
        description: '',
        imageUrl: '',
        featured: false,
      });
      this.variantsText.setValue('');
      this.filePreview.set(null);
      return;
    }
    this.form.reset({
      name: p.name,
      slug: p.slug,
      brandName: p.brand.name,
      brandSlug: p.brand.slug,
      description: p.description,
      imageUrl: p.imageUrl,
      featured: Boolean(p.featured),
    });
    this.variantsText.setValue(
      p.variants
        .map((v) => `${v.flavor} | ${v.nicotineMg} | ${v.price} | ${v.stock}`)
        .join('\n'),
    );
    this.filePreview.set(null);
  }

  close(): void {
    this.closed.emit();
  }

  autofillSlug(): void {
    const name = this.form.controls.name.value;
    if (!this.form.controls.slug.dirty) this.form.controls.slug.setValue(slugify(name));
  }

  autofillBrandSlug(): void {
    const name = this.form.controls.brandName.value;
    if (!this.form.controls.brandSlug.dirty) this.form.controls.brandSlug.setValue(slugify(name));
  }

  onFilePicked(file: File | null): void {
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.filePreview.set(url);
    this.form.controls.imageUrl.setValue(url);
  }

  save(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const baseId = this.product?.id ?? uid('p');
    const variants = this.parseVariants(baseId);
    const next: Product = {
      id: baseId,
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: raw.description.trim(),
      brand: { id: slugify(raw.brandSlug.trim()) || uid('b'), name: raw.brandName.trim(), slug: raw.brandSlug.trim() },
      imageUrl: raw.imageUrl.trim(),
      featured: raw.featured,
      variants,
    };
    this.saved.emit(next);
  }

  private parseVariants(productId: string): ProductVariant[] {
    const lines = this.variantsText.value
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const out: ProductVariant[] = [];
    for (const line of lines) {
      const [flavor, nic, price, stock] = line.split('|').map((x) => x.trim());
      const nicotineMg = Number(nic);
      const p = Number(price);
      const s = Number(stock);
      if (!flavor || !Number.isFinite(nicotineMg) || !Number.isFinite(p) || !Number.isFinite(s)) continue;
      out.push({
        id: uid('v'),
        productId,
        sku: `${productId}-${slugify(flavor)}-${nicotineMg}`,
        flavor,
        nicotineMg,
        price: p,
        stock: Math.max(0, Math.floor(s)),
      });
    }
    if (out.length) return out;
    return [
      {
        id: uid('v'),
        productId,
        sku: `${productId}-default-20`,
        flavor: 'Default',
        nicotineMg: 20,
        price: 10,
        stock: 10,
      },
    ];
  }
}

