import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import gsap from 'gsap';
import { ProductService } from '../../core/services/product.service';
import { prefersReducedMotion, registerGsap } from '../../shared/animation/register-gsap';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, RevealScrollDirective],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnDestroy {
  private readonly products = inject(ProductService);

  readonly featured = toSignal(this.products.getFeaturedProducts(), { initialValue: [] });

  readonly heroWords = [
    'Tu',
    'vape',
    'ideal,',
    'con',
    'estilo',
    'urbano',
    'y',
    'experiencia',
    'premium.',
  ];

  private readonly heroSection = viewChild.required<ElementRef<HTMLElement>>('heroSection');

  private heroFloatTween?: gsap.core.Tween;

  constructor() {
    afterNextRender(() => this.runHeroIntro());
  }

  private runHeroIntro(): void {
    if (prefersReducedMotion()) {
      return;
    }

    registerGsap();

    const root = this.heroSection()?.nativeElement;
    if (!root) {
      return;
    }

    const kicker = root.querySelector<HTMLElement>('.hero-kicker');
    const words = root.querySelectorAll<HTMLElement>('.title-word');
    const lead = root.querySelector<HTMLElement>('.hero-lead');
    const cta = root.querySelector<HTMLElement>('.hero-cta');
    const fine = root.querySelector<HTMLElement>('.hero-fine');
    const art = root.querySelector<HTMLElement>('.hero-art');

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (kicker) {
      tl.from(kicker, { opacity: 0, y: 14, filter: 'blur(6px)', duration: 0.45 }, 0);
    }

    if (words.length) {
      tl.from(
        words,
        {
          opacity: 0,
          y: 20,
          filter: 'blur(12px)',
          duration: 0.52,
          stagger: 0.038,
        },
        0.08,
      );
    }

    if (lead) {
      tl.from(lead, { opacity: 0, y: 16, filter: 'blur(8px)', duration: 0.5 }, '-=0.25');
    }

    if (cta) {
      tl.from(cta, { opacity: 0, y: 12, duration: 0.45 }, '-=0.28');
    }

    if (fine) {
      tl.from(fine, { opacity: 0, duration: 0.35 }, '-=0.2');
    }

    if (art) {
      tl.from(art, { opacity: 0, y: 22, filter: 'blur(8px)', duration: 0.75 }, 0.05);
    }

    const artInner = root.querySelector<HTMLElement>('.hero-art-inner');
    if (artInner) {
      this.heroFloatTween = gsap.to(artInner, {
        y: -6,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }

  ngOnDestroy(): void {
    this.heroFloatTween?.kill();
    this.heroFloatTween = undefined;
  }
}
