import { Component, computed, inject } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [ModalShellComponent],
  templateUrl: './info-modal.component.html',
  styleUrl: './info-modal.component.scss',
})
export class InfoModalComponent {
  private readonly modal = inject(ModalService);

  readonly isOpen = computed(() => this.modal.active() === 'info');

  close(): void {
    this.modal.close();
  }
}
