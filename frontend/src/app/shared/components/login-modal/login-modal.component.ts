import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [ModalShellComponent, ReactiveFormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss',
})
export class LoginModalComponent {
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);

  readonly isOpen = computed(() => this.modal.active() === 'login');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    remember: new FormControl<boolean>(true, { nonNullable: true }),
  });

  close(): void {
    this.modal.close();
    this.error.set(null);
    this.loading.set(false);
  }

  openRegister(): void {
    this.modal.openRegister();
    this.error.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
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
      const { email, password } = this.form.getRawValue();
      const user = await this.auth.login(email, password);
      this.toasts.show(`Bienvenido, ${user.name}`, 'success', 'Sesión iniciada');
      this.close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
      this.error.set(msg);
      this.toasts.show(msg, 'danger', 'Error');
    } finally {
      this.loading.set(false);
    }
  }

  forgotPassword(): void {
    this.toasts.show('Te enviaremos un enlace cuando integremos el backend.', 'info', 'Recuperar contraseña');
  }
}
