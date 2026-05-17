import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [ModalShellComponent, ReactiveFormsModule],
  templateUrl: './forgot-password-modal.component.html',
  styleUrl: './forgot-password-modal.component.scss',
})
export class ForgotPasswordModalComponent {
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);

  readonly isOpen = computed(() => this.modal.active() === 'forgot-password');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submittedEmail = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  close(): void {
    this.modal.close();
    this.reset();
  }

  backToLogin(): void {
    this.modal.openLogin();
    this.reset();
  }

  async submit(): Promise<void> {
    if (this.loading()) return;
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    try {
      const { email } = this.form.getRawValue();
      const normalized = email.trim().toLowerCase();
      await this.auth.requestPasswordReset(normalized);
      this.submittedEmail.set(normalized);
      this.toasts.show(
        'Si ese correo existe en BONGA SHOP, te enviamos instrucciones para restablecer tu contraseña.',
        'success',
        'Revisa tu bandeja',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No pudimos iniciar la recuperación. Inténtalo más tarde.';
      this.error.set(message);
      this.toasts.show(message, 'danger', 'Recuperación de contraseña');
    } finally {
      this.loading.set(false);
    }
  }

  resendAnother(): void {
    this.submittedEmail.set(null);
    this.form.reset({ email: '' });
    this.error.set(null);
  }

  private reset(): void {
    this.form.reset({ email: '' });
    this.error.set(null);
    this.loading.set(false);
    this.submittedEmail.set(null);
  }
}
