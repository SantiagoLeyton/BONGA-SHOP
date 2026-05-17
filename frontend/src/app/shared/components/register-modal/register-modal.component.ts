import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [ModalShellComponent, ReactiveFormsModule],
  templateUrl: './register-modal.component.html',
  styleUrl: './register-modal.component.scss',
})
export class RegisterModalComponent {
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  readonly isOpen = computed(() => this.modal.active() === 'register');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    accept: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  /**
   * Valor reactivo del campo contraseña.
   * Sin esto, `computed()` solo evaluaría una vez porque un FormControl no
   * emite cambios de forma observable para las signals.
   */
  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: this.form.controls.password.value,
  });

  /** Requisitos individuales para poder dar feedback contextual. */
  readonly requirements = computed(() => {
    const p = this.passwordValue() ?? '';
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      digit: /[0-9]/.test(p),
      symbol: /[^A-Za-z0-9]/.test(p),
    };
  });

  /** Estado del medidor. -1 = vacío, 0..4 = niveles de fuerza. */
  readonly strength = computed<number>(() => {
    const p = this.passwordValue() ?? '';
    if (!p) return -1;
    const r = this.requirements();
    let score = 0;
    if (r.length) score += 1;
    if (r.upper) score += 1;
    if (r.digit) score += 1;
    if (r.symbol) score += 1;
    return score;
  });

  /** Etiqueta de fuerza para lectores de pantalla y copy visual. */
  readonly strengthLabel = computed<string>(() => {
    const s = this.strength();
    if (s < 0) return 'Ingresa una contraseña';
    if (s <= 1) return 'Débil';
    if (s === 2) return 'Aceptable';
    if (s === 3) return 'Fuerte';
    return 'Muy fuerte';
  });

  close(): void {
    this.modal.close();
    this.error.set(null);
    this.loading.set(false);
  }

  openLogin(): void {
    this.modal.openLogin(this.modal.authRedirect());
    this.error.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  canSubmit(): boolean {
    return this.form.valid && !this.loading();
  }

  async submit(): Promise<void> {
    if (!this.form.valid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    try {
      const { name, email, password } = this.form.getRawValue();
      const user = await this.auth.register(name, email, password);
      const redirectTo = this.modal.consumeAuthRedirect();
      this.toasts.show(`Cuenta creada para ${user.name}`, 'success', 'Registro completo');
      this.close();
      if (redirectTo) {
        await this.router.navigateByUrl(redirectTo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo completar el registro.';
      this.error.set(message);
      this.toasts.show(message, 'danger', 'Error');
    } finally {
      this.loading.set(false);
    }
  }
}
