import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Brand } from '../../../core/models/brand.model';
import type { Product } from '../../../core/models/product.model';
import type { AdminProductDraft, AdminProductVariantDraft } from '../../../core/services/product.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

type VariantFormGroup = FormGroup<{
  id: FormControl<string>;
  flavor: FormControl<string>;
  nicotineMg: FormControl<number>;
  price: FormControl<number>;
  stock: FormControl<number>;
  active: FormControl<boolean>;
}>;

@Component({
  selector: 'app-admin-product-modal',
  standalone: true,
  imports: [ModalShellComponent, ReactiveFormsModule],
  templateUrl: './admin-product-modal.component.html',
  styleUrl: './admin-product-modal.component.scss',
})
export class AdminProductModalComponent implements OnChanges {
  @Input({ required: true }) isOpen = false;
  @Input() product: Product | null = null;
  @Input() brands: Brand[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AdminProductDraft>();

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    brandId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)],
    }),
    active: new FormControl(true, { nonNullable: true }),
    variants: new FormArray<VariantFormGroup>([]),
  });

  get variants(): FormArray<VariantFormGroup> {
    return this.form.controls.variants;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] || changes['brands'] || changes['isOpen']) {
      this.resetForm();
    }
  }

  close(): void {
    this.closed.emit();
  }

  addVariant(seed?: Partial<AdminProductVariantDraft>): void {
    this.variants.push(
      new FormGroup({
        id: new FormControl(seed?.id ?? '', { nonNullable: true }),
        flavor: new FormControl(seed?.flavor ?? '', {
          nonNullable: true,
          validators: [Validators.required, Validators.minLength(2)],
        }),
        nicotineMg: new FormControl(seed?.nicotineMg ?? 20, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0)],
        }),
        price: new FormControl(seed?.price ?? 10, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0.01)],
        }),
        stock: new FormControl(seed?.stock ?? 0, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0)],
        }),
        active: new FormControl(seed?.active ?? true, { nonNullable: true }),
      }),
    );
  }

  removeVariant(index: number): void {
    if (this.variants.length <= 1) {
      return;
    }
    this.variants.removeAt(index);
  }

  save(): void {
    if (this.form.invalid || !this.variants.length) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saved.emit({
      id: this.product?.id,
      name: raw.name.trim(),
      brandId: raw.brandId,
      description: raw.description.trim(),
      active: raw.active,
      variants: raw.variants.map((variant) => ({
        id: variant.id || undefined,
        flavor: variant.flavor.trim(),
        nicotineMg: Number(variant.nicotineMg),
        price: Number(variant.price),
        stock: Math.max(0, Math.floor(Number(variant.stock))),
        active: variant.active,
      })),
    });
  }

  trackVariant(_: number, group: VariantFormGroup): string {
    return group.controls.id.value || `${group.controls.flavor.value}-${group.controls.nicotineMg.value}`;
  }

  selectedBrandName(): string {
    return this.brands.find((brand) => brand.id === this.form.controls.brandId.value)?.name ?? 'Sin marca';
  }

  private resetForm(): void {
    this.variants.clear();

    const product = this.product;
    const firstBrandId = this.brands[0]?.id ?? '';

    if (!product) {
      this.form.reset({
        name: '',
        brandId: firstBrandId,
        description: '',
        active: true,
      });
      this.addVariant();
      return;
    }

    this.form.reset({
      name: product.name,
      brandId: product.brand.id,
      description: product.description,
      active: product.active ?? true,
    });

    const variants = product.variants.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          flavor: variant.flavor,
          nicotineMg: variant.nicotineMg,
          price: variant.price,
          stock: variant.stock,
          active: variant.active ?? true,
        }))
      : [{ active: true }];

    variants.forEach((variant) => this.addVariant(variant));
  }
}
