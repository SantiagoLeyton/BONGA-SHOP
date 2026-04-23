import { Injectable, signal } from '@angular/core';

export type ModalId = 'login' | 'register' | 'info' | 'forgot-password';

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly active = signal<ModalId | null>(null);
  readonly authRedirect = signal<string | null>(null);

  openLogin(redirectTo?: string | null): void {
    this.authRedirect.set(redirectTo ?? null);
    this.active.set('login');
  }

  openRegister(redirectTo?: string | null): void {
    this.authRedirect.set(redirectTo ?? null);
    this.active.set('register');
  }

  openForgotPassword(): void {
    this.active.set('forgot-password');
  }

  openInfo(): void {
    this.active.set('info');
  }

  close(): void {
    this.active.set(null);
  }

  consumeAuthRedirect(): string | null {
    const redirect = this.authRedirect();
    this.authRedirect.set(null);
    return redirect;
  }
}
