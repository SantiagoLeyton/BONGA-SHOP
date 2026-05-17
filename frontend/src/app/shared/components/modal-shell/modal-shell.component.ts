import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.scss',
})
export class ModalShellComponent {
  private static nextId = 0;
  readonly titleId = `bonga-modal-${ModalShellComponent.nextId++}`;

  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) title = '';
  @Output() closed = new EventEmitter<void>();

  onBackdrop(): void {
    this.closed.emit();
  }

  onCloseClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closed.emit();
  }
}
