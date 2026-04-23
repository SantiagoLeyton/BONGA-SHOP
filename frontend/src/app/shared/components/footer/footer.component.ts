import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { scrollWindowToTop } from '../../utils/scroll.util';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);

  readonly year = new Date().getFullYear();
  readonly isAuthed = this.auth.isAuthed;
  readonly user = this.auth.user;
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  openInfo(): void {
    this.modal.openInfo();
  }

  openRegister(): void {
    this.modal.openRegister();
  }

  scrollToTop(): void {
    scrollWindowToTop();
  }
}
