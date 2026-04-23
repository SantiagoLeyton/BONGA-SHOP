import { afterNextRender, Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';
import { routeAnimations } from '../../shared/animations/route.animations';
import { registerGsap } from '../../shared/animation/register-gsap';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { InfoModalComponent } from '../../shared/components/info-modal/info-modal.component';
import { IntroOverlayComponent } from '../../shared/components/intro-overlay/intro-overlay.component';
import { LoginModalComponent } from '../../shared/components/login-modal/login-modal.component';
import { ForgotPasswordModalComponent } from '../../shared/components/forgot-password-modal/forgot-password-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RegisterModalComponent } from '../../shared/components/register-modal/register-modal.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    IntroOverlayComponent,
    NavbarComponent,
    FooterComponent,
    LoginModalComponent,
    RegisterModalComponent,
    ForgotPasswordModalComponent,
    InfoModalComponent,
    ToastContainerComponent,
    CartDrawerComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  animations: [routeAnimations],
})
export class MainLayoutComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastService);
  private readonly modal = inject(ModalService);
  private sub?: { unsubscribe(): void };

  constructor() {
    afterNextRender(() => {
      registerGsap();
      this.sub = this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.handleRouteFeedback();
          requestAnimationFrame(() => ScrollTrigger.refresh());
        });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  readonly outletKey = () => this.router.url;

  private handleRouteFeedback(): void {
    const query = this.route.snapshot.queryParams;
    const redirectTo = typeof query['redirectTo'] === 'string' ? query['redirectTo'] : null;

    if (query['login'] === '1') {
      this.modal.openLogin(redirectTo);
      this.toasts.show('Inicia sesion para continuar con esa seccion.', 'info', 'Acceso requerido', 3200);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { login: null, needAdmin: null, redirectTo: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }

    if (query['needAdmin'] === '1') {
      this.toasts.show(
        'Tu cuenta no tiene permisos para acceder al panel administrativo.',
        'warning',
        'Acceso restringido',
        3200,
      );
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { needAdmin: null, redirectTo: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }
}
