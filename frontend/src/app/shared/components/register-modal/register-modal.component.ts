import { Component, computed, inject, signal } from '@angular/core';
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

  readonly strength = computed(() => {
    const password = this.form.controls.password.value;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
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
