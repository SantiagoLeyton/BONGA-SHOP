import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
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

  readonly isOpen = computed(() => this.modal.active() === 'register');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    accept: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  readonly strength = computed(() => {
    const p = this.form.controls.password.value;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return score; // 0..4
  });

  readonly canSubmit = computed(() => this.form.valid && !this.loading());

  close(): void {
    this.modal.close();
    this.error.set(null);
    this.loading.set(false);
  }

  openLogin(): void {
    this.modal.openLogin();
    this.error.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
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
      this.toasts.show(`Cuenta creada para ${user.name}`, 'success', 'Registro completo');
      this.close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo completar el registro.';
      this.error.set(msg);
      this.toasts.show(msg, 'danger', 'Error');
    } finally {
      this.loading.set(false);
    }
  }
}
