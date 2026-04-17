import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

type StepId = 'address' | 'shipping' | 'payment' | 'done';

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, AppCurrencyPipe],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly orders = inject(OrderService);

  readonly step = signal<StepId>('address');

  readonly addressForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(7)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address1: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  readonly shipping = signal<'standard' | 'express'>('standard');
  readonly pay = signal<'cod' | 'card'>('cod');
  readonly placing = signal(false);
  readonly orderId = signal<string | null>(null);

  readonly cartCount = computed(() => this.cart.count());

  readonly shippingPrice = computed(() => {
    if (this.cartCount() === 0) return 0;
    return this.shipping() === 'express' ? 5.9 : 3.9;
  });

  readonly total = computed(() => {
    return this.shippingPrice();
  });

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
    this.step.set('shipping');
  }

  nextFromShipping(): void {
    this.step.set('payment');
  }

  back(): void {
    switch (this.step()) {
      case 'shipping':
        this.step.set('address');
        return;
      case 'payment':
        this.step.set('shipping');
        return;
      default:
        return;
    }
  }

  async placeOrder(): Promise<void> {
    if (this.placing()) return;

    this.placing.set(true);

    try {
      const id = `BONGA-${uid().slice(-8).toUpperCase()}`;
      this.orderId.set(id);

      const lines = this.cart.items().map((l) => ({ ...l }));
      const address = this.addressForm.getRawValue();

      await this.orders.createOrder({
        id,
        createdAt: new Date().toISOString(),
        status: 'created',
        shipping: this.shipping(),
        payment: this.pay(),
        address: {
          name: address.name,
          email: address.email,
          phone: address.phone,
          city: address.city,
          address1: address.address1,
          notes: address.notes,
        },
        lines,
      });

      this.cart.clear();
      this.step.set('done');
      this.toasts.show('Orden creada', 'success', id);

    } catch (error) {
      this.toasts.show('Error al crear la orden', 'danger', 'Checkout');
    } finally {
      this.placing.set(false);
    }
  }
}
