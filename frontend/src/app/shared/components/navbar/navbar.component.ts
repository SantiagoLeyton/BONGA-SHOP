import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly modal = inject(ModalService);

  readonly menuOpen = signal(false);

  openLogin(): void {
    this.menuOpen.set(false);
    this.modal.openLogin();
  }

  openRegister(): void {
    this.menuOpen.set(false);
    this.modal.openRegister();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.menuOpen.set(false);
  }
}
