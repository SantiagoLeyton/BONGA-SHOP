import { Injectable, signal } from '@angular/core';

export type ModalId = 'login' | 'register' | 'info';

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly active = signal<ModalId | null>(null);

  openLogin(): void {
    this.active.set('login');
  }

  openRegister(): void {
    this.active.set('register');
  }

  openInfo(): void {
    this.active.set('info');
  }

  close(): void {
    this.active.set(null);
  }
}
