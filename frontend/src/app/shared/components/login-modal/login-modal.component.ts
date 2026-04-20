import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
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
  private readonly router = inject(Router);

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

  readonly canSubmit = computed(() => this.form.valid && !this.loading());

  close(): void {
    this.modal.close();
    this.error.set(null);
    this.loading.set(false);
  }

  openRegister(): void {
    this.modal.openRegister(this.modal.authRedirect());
    this.error.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
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
      const redirectTo = this.modal.consumeAuthRedirect();
      this.toasts.show(`Bienvenido, ${user.name}`, 'success', 'Sesion iniciada');
      this.close();
      if (redirectTo) {
        await this.router.navigateByUrl(redirectTo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesion.';
      this.error.set(message);
      this.toasts.show(message, 'danger', 'Error');
    } finally {
      this.loading.set(false);
    }
  }

  forgotPassword(): void {
    this.toasts.show('La recuperacion de contrasena estara disponible en una siguiente etapa.', 'info', 'Ayuda');
  }
}
