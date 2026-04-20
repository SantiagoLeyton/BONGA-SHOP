import { afterNextRender, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import gsap from 'gsap';
import { map } from 'rxjs';
import { MOCK_PRODUCTS } from '../../core/data/mock-products';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { ModalService } from '../../core/services/modal.service';
import { prefersReducedMotion, registerGsap } from '../../shared/animation/register-gsap';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

function countVariants(products: typeof MOCK_PRODUCTS): number {
  return products.reduce((n, p) => n + p.variants.length, 0);
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, RevealScrollDirective, ProductCardComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly products = inject(ProductService);
  private readonly modals = inject(ModalService);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly isAdmin = () => this.auth.user()?.role === 'admin';

  /** Dos frases del titular — “Sabor urbano.” / “Sin ruido.” */
  readonly heroLine1 = ['Sabor', 'urbano.'];
  readonly heroLine2 = ['Sin', 'ruido.'];

  readonly featuredPicks = toSignal(
    this.products.getFeaturedProducts().pipe(map((list) => list.slice(0, 4))),
    { initialValue: [] },
  );

  /** Índice del producto “héroe” (centro visual) en Destacados */
  readonly featuredCenterIndex = computed(() => {
    const n = this.featuredPicks().length;
    if (n <= 1) {
      return 0;
    }
    return Math.floor((n - 1) / 2);
  });

  readonly heroImageReady = signal(false);

  readonly statTargets = {
    products: MOCK_PRODUCTS.length,
    variants: countVariants(MOCK_PRODUCTS),
  };

  private readonly heroSection = viewChild.required<ElementRef<HTMLElement>>('heroSection');
  private readonly statProductsEl = viewChild<ElementRef<HTMLElement>>('statProducts');
  private readonly statVariantsEl = viewChild<ElementRef<HTMLElement>>('statVariants');

  constructor() {
    afterNextRender(() => {
      this.runHeroIntro();
      this.runHeroMicroMotion();
    });
  }

  onHeroImageLoad(): void {
    this.heroImageReady.set(true);
  }

  scrollToDestacados(): void {
    document.getElementById('destacados')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  openBuyingInfo(): void {
    this.modals.openInfo();
  }

  openLegalInfo(): void {
    this.modals.openInfo();
  }

  private runHeroIntro(): void {
    if (prefersReducedMotion()) {
      requestAnimationFrame(() => this.applyStatValuesImmediate());
      return;
    }
    registerGsap();
    const root = this.heroSection()?.nativeElement;
    if (!root) {
      return;
    }

    const kicker = root.querySelector<HTMLElement>('.hero-kicker');
    const badge = root.querySelector<HTMLElement>('.hero-badge');
    const words = root.querySelectorAll<HTMLElement>('.title-word');
    const lead = root.querySelector<HTMLElement>('.hero-lead');
    const stats = root.querySelector<HTMLElement>('.hero-stats');
    const cta = root.querySelector<HTMLElement>('.hero-cta');
    const fine = root.querySelector<HTMLElement>('.hero-fine');
    const scrollMin = root.querySelector<HTMLElement>('.hero-scroll-min');

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (kicker) {
      tl.from(kicker, { opacity: 0, y: 14, filter: 'blur(6px)', duration: 0.45 }, 0);
    }
    if (badge) {
      tl.from(badge, { opacity: 0, y: 10, scale: 0.96, duration: 0.5 }, 0.06);
    }
    if (words.length) {
      tl.from(
        words,
        {
          opacity: 0,
          y: 20,
          filter: 'blur(12px)',
          duration: 0.52,
          stagger: 0.036,
        },
        0.1,
      );
    }
    if (lead) {
      tl.from(lead, { opacity: 0, y: 16, filter: 'blur(8px)', duration: 0.5 }, '-=0.2');
    }
    if (stats) {
      tl.from(stats, { opacity: 0, y: 14, duration: 0.5 }, '-=0.26');
    }
    if (cta) {
      tl.from(cta, { opacity: 0, y: 12, duration: 0.45 }, '-=0.28');
    }
    if (fine) {
      tl.from(fine, { opacity: 0, duration: 0.35 }, '-=0.2');
    }

    const heroBg = root.querySelector<HTMLElement>('.hero-bg');
    if (heroBg) {
      tl.from(heroBg, { opacity: 0.68, duration: 1.25, ease: 'power2.out' }, 0);
    }

    if (scrollMin) {
      tl.from(scrollMin, { opacity: 0, duration: 0.5 }, '-=0.12');
    }

    tl.add(() => this.animateStatCounters());
  }

  private runHeroMicroMotion(): void {
    if (prefersReducedMotion() || typeof document === 'undefined') {
      return;
    }
    registerGsap();
    const line = document.querySelector<HTMLElement>('.hero-scroll-min__line');
    if (line) {
      gsap.fromTo(
        line,
        { scaleY: 0.35, opacity: 0.45 },
        {
          scaleY: 1,
          opacity: 0.85,
          duration: 1.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        },
      );
    }
  }

  private animateStatCounters(): void {
    if (prefersReducedMotion()) {
      this.applyStatValuesImmediate();
      return;
    }
    const pEl = this.statProductsEl()?.nativeElement;
    const vEl = this.statVariantsEl()?.nativeElement;
    const products = { n: 0 };
    const variants = { n: 0 };

    if (pEl) {
      gsap.to(products, {
        n: this.statTargets.products,
        duration: 1.85,
        ease: 'power2.out',
        onUpdate: () => {
          pEl.textContent = String(Math.round(products.n));
        },
      });
    }
    if (vEl) {
      gsap.to(variants, {
        n: this.statTargets.variants,
        duration: 2.1,
        ease: 'power2.out',
        delay: 0.12,
        onUpdate: () => {
          vEl.textContent = String(Math.round(variants.n));
        },
      });
    }
  }

  private applyStatValuesImmediate(): void {
    const pEl = this.statProductsEl()?.nativeElement;
    const vEl = this.statVariantsEl()?.nativeElement;
    if (pEl) {
      pEl.textContent = String(this.statTargets.products);
    }
    if (vEl) {
      vEl.textContent = String(this.statTargets.variants);
    }
  }
}
