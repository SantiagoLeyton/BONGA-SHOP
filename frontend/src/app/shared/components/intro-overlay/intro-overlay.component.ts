import { CommonModule } from '@angular/common';
import { afterNextRender, Component, OnDestroy, signal } from '@angular/core';
import gsap from 'gsap';
import { prefersReducedMotion, registerGsap } from '../../animation/register-gsap';

const INTRO_SEEN_KEY = 'bonga:introSeen:v1';

@Component({
  selector: 'app-intro-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-overlay.component.html',
  styleUrl: './intro-overlay.component.scss',
})
export class IntroOverlayComponent implements OnDestroy {
  readonly visible = signal(false);

  private tl?: gsap.core.Timeline;

  constructor() {
    afterNextRender(() => this.maybeShow());
  }

  private maybeShow(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Show once per tab session.
    if (sessionStorage.getItem(INTRO_SEEN_KEY) === '1') {
      return;
    }
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');

    if (prefersReducedMotion()) {
      this.visible.set(true);
      window.setTimeout(() => this.visible.set(false), 220);
      return;
    }

    registerGsap();
    this.visible.set(true);

    // Wait one paint so the overlay is in the DOM.
    requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>('.intro');
      const logo = root?.querySelector<HTMLElement>('.intro__logo');
      const tag = root?.querySelector<HTMLElement>('.intro__tag');
      const glow = root?.querySelector<HTMLElement>('.intro__glow');

      if (!root) {
        this.visible.set(false);
        return;
      }

      this.tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => this.visible.set(false),
      });

      this.tl.set(root, { opacity: 1 }, 0);

      if (glow) {
        this.tl.fromTo(
          glow,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1.05, duration: 0.65 },
          0,
        );
      }

      if (logo) {
        this.tl.fromTo(
          logo,
          { opacity: 0, y: 18, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6 },
          0.05,
        );
      }

      if (tag) {
        this.tl.fromTo(tag, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45 }, 0.18);
      }

      // Hold briefly, then fade out.
      this.tl.to(root, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.95);
    });
  }

  ngOnDestroy(): void {
    this.tl?.kill();
    this.tl = undefined;
  }
}
