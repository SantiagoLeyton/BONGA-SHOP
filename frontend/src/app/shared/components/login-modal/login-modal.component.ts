import { Component, computed, inject } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [ModalShellComponent],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss',
})
export class LoginModalComponent {
  private readonly modal = inject(ModalService);

  readonly isOpen = computed(() => this.modal.active() === 'login');

  close(): void {
    this.modal.close();
  }

  openRegister(): void {
    this.modal.openRegister();
  }
}
