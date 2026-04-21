import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountProfileService } from '../../core/services/account-profile.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

type StepId = 'address' | 'review' | 'confirm' | 'done';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, AppCurrencyPipe],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly orders = inject(OrderService);
  private readonly products = inject(ProductService);
  private readonly accountProfile = inject(AccountProfileService);

  readonly step = signal<StepId>('address');
  readonly productList = toSignal(this.products.getProducts(), { initialValue: [] });

  readonly addressForm = new FormGroup({
    name: new FormControl(this.accountProfile.profile()?.name ?? this.auth.user()?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    phone: new FormControl(this.accountProfile.profile()?.phone ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)],
    }),
    city: new FormControl(this.accountProfile.profile()?.city ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    address1: new FormControl(this.accountProfile.profile()?.address1 ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    notes: new FormControl(this.accountProfile.profile()?.notes ?? '', { nonNullable: true }),
  });

  /** Indica si el formulario se auto-completó con los datos guardados en "Mi cuenta". */
  readonly prefilledFromAccount = signal(this.accountProfile.hasProfile());

  readonly placing = signal(false);
  readonly orderId = signal<string | null>(null);

  readonly cartCount = computed(() => this.cart.count());
  readonly isLoading = computed(() => !this.cart.loaded());
  readonly subtotal = computed(() => {
    const products = new Map(this.productList().map((product) => [product.id, product]));
    return this.cart.items().reduce((sum, item) => {
      const product = products.get(item.productId);
      const variant = product?.variants.find((entry) => entry.id === item.variantId);
      return sum + (variant?.price ?? 0) * item.qty;
    }, 0);
  });

  readonly total = computed(() => this.subtotal());

  constructor() {
    effect(() => {
      if (this.cart.loaded() && this.cartCount() === 0 && this.step() !== 'done') {
        void this.router.navigateByUrl('/cart');
      }
    });
  }

  nextFromAddress(): void {
    if (!this.addressForm.valid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.step.set('review');
  }

  nextFromReview(): void {
    this.step.set('confirm');
  }

  back(): void {
    switch (this.step()) {
      case 'review':
        this.step.set('address');
        return;
      case 'confirm':
        this.step.set('review');
        return;
      default:
        return;
    }
  }

  async placeOrder(): Promise<void> {
    if (this.placing()) return;

    this.placing.set(true);

    try {
      const address = this.addressForm.getRawValue();

      const order = await this.orders.createOrder({
        shippingData: {
          recipientName: address.name,
          phone: address.phone,
          address: address.address1,
          city: address.city,
          notes: address.notes || undefined,
        },
      });

      this.orderId.set(order.id);
      await this.cart.refresh();
      this.step.set('done');
      this.toasts.show('Orden creada', 'success', `Orden #${order.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la orden';
      this.toasts.show(message, 'danger', 'Checkout');
    } finally {
      this.placing.set(false);
    }
  }

  fieldInvalid(name: 'name' | 'phone' | 'city' | 'address1'): boolean {
    const control = this.addressForm.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Permite solo dígitos con un `+` opcional al inicio; fuerza hasta 15 dígitos. */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value ?? '';
    const hasPlus = raw.trimStart().startsWith('+');
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    const next = (hasPlus ? '+' : '') + digits;

    if (input.value !== next) {
      input.value = next;
    }
    this.addressForm.controls.phone.setValue(next, { emitEvent: false });
  }

  phoneErrorMessage(): string | null {
    const control = this.addressForm.controls.phone;
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    if (control.hasError('required')) return 'Ingresa un número de teléfono para coordinar la entrega.';
    if (control.hasError('pattern')) return 'Solo dígitos (10 a 15), con "+" opcional al inicio. Ej. +57 3001234567.';
    return 'Ingresa un teléfono válido.';
  }
}
