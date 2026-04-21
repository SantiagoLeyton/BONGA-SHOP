import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  AccountProfile,
  AccountProfileService,
} from '../../core/services/account-profile.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly profileService = inject(AccountProfileService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);

  readonly user = this.auth.user;
  readonly profile = this.profileService.profile;
  readonly hasProfile = this.profileService.hasProfile;

  readonly saving = signal(false);
  readonly justSaved = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    address1: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    notes: new FormControl('', { nonNullable: true }),
  });

  readonly initials = computed(() => {
    const source = this.form.controls.name.value || this.user()?.name || '';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '·';
    const first = parts[0][0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  });

  constructor() {
    this.hydrate();
  }

  /** Rellena el formulario con los datos guardados (o el nombre/correo del auth). */
  private hydrate(): void {
    const saved = this.profile();
    const authUser = this.user();
    this.form.reset({
      name: saved?.name ?? authUser?.name ?? '',
      lastName: saved?.lastName ?? '',
      email: saved?.email ?? authUser?.email ?? '',
      phone: saved?.phone ?? '',
      city: saved?.city ?? '',
      address1: saved?.address1 ?? '',
      notes: saved?.notes ?? '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  fieldInvalid(name: 'name' | 'phone' | 'city' | 'address1' | 'email'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Sanitiza el input de teléfono: solo dígitos con un "+" opcional al inicio. */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value ?? '';
    const hasPlus = raw.trimStart().startsWith('+');
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    const next = (hasPlus ? '+' : '') + digits;

    if (input.value !== next) {
      input.value = next;
    }
    this.form.controls.phone.setValue(next, { emitEvent: false });
  }

  phoneErrorMessage(): string | null {
    const control = this.form.controls.phone;
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    if (control.hasError('required')) return 'Ingresa un número de teléfono para coordinar la entrega.';
    if (control.hasError('pattern')) return 'Solo dígitos (10 a 15), con "+" opcional al inicio. Ej. +57 3001234567.';
    return 'Ingresa un teléfono válido.';
  }

  emailErrorMessage(): string | null {
    const control = this.form.controls.email;
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    if (control.hasError('email')) return 'Usa un correo con formato válido (nombre@dominio.com).';
    return null;
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.toasts.show('Revisa los campos marcados antes de guardar.', 'warning', 'Mi cuenta');
      return;
    }

    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      const clean: AccountProfile = {
        name: value.name.trim(),
        lastName: value.lastName?.trim() || undefined,
        email: value.email?.trim() || undefined,
        phone: value.phone.trim(),
        city: value.city.trim(),
        address1: value.address1.trim(),
        notes: value.notes?.trim() || undefined,
      };

      await new Promise((r) => setTimeout(r, 380));
      this.profileService.save(clean);
      this.form.markAsPristine();
      this.justSaved.set(true);
      this.toasts.show('Tus datos se guardaron correctamente.', 'success', 'Mi cuenta');
      window.setTimeout(() => this.justSaved.set(false), 2600);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar tu información.';
      this.toasts.show(message, 'danger', 'Mi cuenta');
    } finally {
      this.saving.set(false);
    }
  }

  reset(): void {
    this.hydrate();
    this.toasts.show('Cambios descartados.', 'info', 'Mi cuenta');
  }

  clearAll(): void {
    if (!this.hasProfile()) return;
    if (!window.confirm('Se eliminarán los datos guardados de tu cuenta. Quieres continuar?')) {
      return;
    }
    this.profileService.clear();
    this.hydrate();
    this.toasts.show('Datos de cuenta eliminados.', 'info', 'Mi cuenta');
  }
}
