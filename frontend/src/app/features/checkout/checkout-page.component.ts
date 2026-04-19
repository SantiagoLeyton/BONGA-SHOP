import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

  readonly step = signal<StepId>('address');
  readonly productList = toSignal(this.products.getProducts(), { initialValue: [] });

  readonly addressForm = new FormGroup({
    name: new FormControl(this.auth.user()?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(7)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address1: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  readonly placing = signal(false);
  readonly orderId = signal<string | null>(null);

  readonly cartCount = computed(() => this.cart.count());
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
    if (this.cartCount() === 0) {
      this.router.navigateByUrl('/cart');
    }
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
        items: this.cart.items().map((item) => ({ ...item })),
        shippingData: {
          recipientName: address.name,
          phone: address.phone,
          address: address.address1,
          city: address.city,
          notes: address.notes || undefined,
        },
      });

      this.orderId.set(order.id);
      this.cart.clear();
      this.step.set('done');
      this.toasts.show('Orden creada', 'success', `Orden #${order.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la orden';
      this.toasts.show(message, 'danger', 'Checkout');
    } finally {
      this.placing.set(false);
    }
  }
}
