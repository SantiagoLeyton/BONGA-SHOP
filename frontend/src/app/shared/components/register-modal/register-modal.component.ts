import { Component, computed, inject } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [ModalShellComponent],
  templateUrl: './register-modal.component.html',
  styleUrl: './register-modal.component.scss',
})
export class RegisterModalComponent {
  private readonly modal = inject(ModalService);

  readonly isOpen = computed(() => this.modal.active() === 'register');

  close(): void {
    this.modal.close();
  }

  openLogin(): void {
    this.modal.openLogin();
  }
}
