import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly modal = inject(ModalService);

  readonly year = new Date().getFullYear();

  openInfo(): void {
    this.modal.openInfo();
  }
}
