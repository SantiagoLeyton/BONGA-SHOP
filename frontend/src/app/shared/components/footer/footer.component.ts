import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { scrollWindowToTop } from '../../utils/scroll.util';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly year = new Date().getFullYear();
  readonly isAuthed = this.auth.isAuthed;
  readonly user = this.auth.user;
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  private readonly currentUrl = signal(this.router.url);
  readonly showCatalogCta = computed(() => !this.currentUrl().startsWith('/products'));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

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
