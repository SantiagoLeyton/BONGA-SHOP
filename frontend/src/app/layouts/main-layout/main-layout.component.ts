import { afterNextRender, Component, inject, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { InfoModalComponent } from '../../shared/components/info-modal/info-modal.component';
import { IntroOverlayComponent } from '../../shared/components/intro-overlay/intro-overlay.component';
import { LoginModalComponent } from '../../shared/components/login-modal/login-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RegisterModalComponent } from '../../shared/components/register-modal/register-modal.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { filter } from 'rxjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerGsap } from '../../shared/animation/register-gsap';
import { routeAnimations } from '../../shared/animations/route.animations';

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
    InfoModalComponent,
    ToastContainerComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  animations: [routeAnimations],
})
export class MainLayoutComponent implements OnDestroy {
  private readonly router = inject(Router);
  private sub?: { unsubscribe(): void };

  constructor() {
    afterNextRender(() => {
      registerGsap();
      this.sub = this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => {
          // Ensure ScrollTrigger recalculates after route content swaps
          requestAnimationFrame(() => ScrollTrigger.refresh());
        });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  readonly outletKey = () => this.router.url;
}
