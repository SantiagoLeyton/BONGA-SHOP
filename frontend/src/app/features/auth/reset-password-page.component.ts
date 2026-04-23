import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface PasswordRequirement {
  readonly id: 'length' | 'lower' | 'upper' | 'digit';
  readonly label: string;
  readonly passed: boolean;
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);
  private readonly toasts = inject(ToastService);

  readonly state = signal<SubmitState>('idle');
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
    confirm: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly token = computed(() => {
    const value = this.route.snapshot.queryParamMap.get('token') ?? '';
    return value.trim();
  });

  readonly hasToken = computed(() => this.token().length > 0);

  private readonly passwordValue = toSignal(
    this.form.controls.password.valueChanges.pipe(
      startWith(this.form.controls.password.value),
      map((value) => value ?? ''),
    ),
    { initialValue: '' },
  );

  private readonly confirmValue = toSignal(
    this.form.controls.confirm.valueChanges.pipe(
      startWith(this.form.controls.confirm.value),
      map((value) => value ?? ''),
    ),
    { initialValue: '' },
  );

  readonly requirements = computed<PasswordRequirement[]>(() => {
    const value = this.passwordValue();
    return [
      { id: 'length', label: 'Al menos 8 caracteres', passed: value.length >= 8 },
      { id: 'lower', label: 'Una minúscula', passed: /[a-z]/.test(value) },
      { id: 'upper', label: 'Una mayúscula', passed: /[A-Z]/.test(value) },
      { id: 'digit', label: 'Un número', passed: /\d/.test(value) },
    ];
  });

  readonly passwordsMatch = computed(
    () => this.passwordValue().length > 0 && this.passwordValue() === this.confirmValue(),
  );

  readonly strength = computed(() => {
    const value = this.passwordValue();
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^\w\s]/.test(value)) score += 1;
    return Math.min(score, 4);
  });

  /**
   * Explica de forma clara por qué todavía no se puede enviar el formulario.
   * Devuelve null cuando todo está listo.
   */
  readonly blocker = computed<string | null>(() => {
    if (!this.hasToken()) {
      return 'El enlace no contiene un token válido. Solicita uno nuevo desde el inicio de sesión.';
    }
    const password = this.passwordValue();
    const confirm = this.confirmValue();
    if (password.length < 8) {
      return 'La nueva contraseña debe tener al menos 8 caracteres.';
    }
    if (password.length > 72) {
      return 'La nueva contraseña no puede superar 72 caracteres.';
    }
    if (!confirm) {
      return 'Confirma la nueva contraseña para continuar.';
    }
    if (password !== confirm) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  });

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  openLogin(): void {
    this.modal.openLogin();
  }

  async submit(): Promise<void> {
    if (this.state() === 'loading') return;

    const blocker = this.blocker();
    if (blocker) {
      this.error.set(blocker);
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.state.set('loading');
    try {
      const password = this.form.controls.password.value;
      await this.auth.confirmPasswordReset(this.token(), password);
      this.state.set('success');
      this.toasts.show(
        'Listo, tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.',
        'success',
        'Contraseña actualizada',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No pudimos actualizar la contraseña. Inténtalo nuevamente.';
      this.error.set(message);
      this.state.set('error');
      this.toasts.show(message, 'danger', 'No se pudo restablecer');
    }
  }

  async goToLogin(): Promise<void> {
    await this.router.navigateByUrl('/');
    this.modal.openLogin();
  }
}
