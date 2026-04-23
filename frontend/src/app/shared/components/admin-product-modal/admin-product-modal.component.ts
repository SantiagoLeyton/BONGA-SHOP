import { Component, DestroyRef, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
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

export type AdminProductSavedEvent = {
  draft: AdminProductDraft;
  imageFile: File | null;
};

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
  @Input() saving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AdminProductSavedEvent>();

  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  private readonly destroyRef = inject(DestroyRef);

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

  imagePreview: string | null = null;
  imageError: string | null = null;
  imageFile: File | null = null;
  /** URL de imagen actual del producto cuando se está editando (cuando no se eligió nueva). */
  private existingImageUrl: string | null = null;
  /** ObjectURL temporal que debemos revocar al reemplazar o cerrar. */
  private localPreviewUrl: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeLocalPreview());
  }

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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setImageFile(file);
  }

  onImageDropped(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setImageFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  clearImage(): void {
    this.revokeLocalPreview();
    this.imageFile = null;
    this.imagePreview = this.existingImageUrl;
    this.imageError = null;
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  triggerImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  save(): void {
    if (this.form.invalid || !this.variants.length) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saved.emit({
      draft: {
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
      },
      imageFile: this.imageFile,
    });
  }

  trackVariant(_: number, group: VariantFormGroup): string {
    return group.controls.id.value || `${group.controls.flavor.value}-${group.controls.nicotineMg.value}`;
  }

  selectedBrandName(): string {
    return this.brands.find((brand) => brand.id === this.form.controls.brandId.value)?.name ?? 'Sin marca';
  }

  fieldInvalid(name: 'name' | 'brandId' | 'description'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  /**
   * Devuelve un mensaje claro explicando por qué el formulario todavía no se puede guardar.
   * Si está completo y válido retorna {@code null}.
   */
  getBlocker(): string | null {
    if (!this.brands.length) {
      return 'No hay marcas activas. Crea al menos una marca antes de registrar productos.';
    }

    const name = this.form.controls.name.value.trim();
    if (name.length < 2) {
      return 'Ingresa un nombre de producto de al menos 2 caracteres.';
    }

    if (!this.form.controls.brandId.value) {
      return 'Selecciona una marca para el producto.';
    }

    const description = this.form.controls.description.value.trim();
    if (description.length < 10) {
      return 'La descripción debe tener al menos 10 caracteres.';
    }
    if (description.length > 1000) {
      return 'La descripción no puede superar los 1000 caracteres.';
    }

    if (!this.variants.length) {
      return 'Agrega al menos una variante.';
    }

    for (let i = 0; i < this.variants.length; i++) {
      const variant = this.variants.at(i);
      const flavor = (variant.controls.flavor.value ?? '').trim();
      if (flavor.length < 2) {
        return `Completa el sabor de la variante #${i + 1}.`;
      }
      if (Number(variant.controls.nicotineMg.value) < 0) {
        return `La nicotina de la variante #${i + 1} no puede ser negativa.`;
      }
      if (Number(variant.controls.price.value) < 0.01) {
        return `Ingresa un precio válido para la variante #${i + 1}.`;
      }
      if (Number(variant.controls.stock.value) < 0) {
        return `El stock de la variante #${i + 1} no puede ser negativo.`;
      }
    }

    return null;
  }

  private setImageFile(file: File | null): void {
    if (!file) {
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      this.imageError = 'Formato no soportado. Usa JPG, PNG o WEBP.';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.imageError = 'La imagen supera el tamaño máximo de 5 MB.';
      return;
    }
    this.revokeLocalPreview();
    this.imageFile = file;
    this.imageError = null;
    this.localPreviewUrl = URL.createObjectURL(file);
    this.imagePreview = this.localPreviewUrl;
  }

  private revokeLocalPreview(): void {
    if (this.localPreviewUrl) {
      URL.revokeObjectURL(this.localPreviewUrl);
      this.localPreviewUrl = null;
    }
  }

  private resetForm(): void {
    this.variants.clear();
    this.revokeLocalPreview();
    this.imageFile = null;
    this.imageError = null;

    const product = this.product;
    const firstBrandId = this.brands[0]?.id ?? '';
    this.existingImageUrl = product?.imageUrl ?? null;
    this.imagePreview = this.existingImageUrl;

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
