import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
  input,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, registerGsap } from '../animation/register-gsap';

/**
 * Scroll reveal: fade + lift + blur-to-sharp (vapor-friendly).
 * Inspired by “text/blur” style showcases; implemented with GSAP for Angular.
 *
 * Incluye comprobaciones diferidas para scroll programático (p. ej. scrollIntoView
 * a #destacados): sin ellas, ScrollTrigger puede no disparar y el bloque queda en opacity:0.
 */
@Directive({
  selector: '[appRevealScroll]',
  standalone: true,
})
export class RevealScrollDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Extra delay in seconds (e.g. stagger with index * 0.03) */
  readonly appRevealDelay = input(0);

  private trigger?: ScrollTrigger;
  private revealed = false;
  private readonly deferredTimers: number[] = [];
  private scrollEndListener?: () => void;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    if (prefersReducedMotion()) {
      return;
    }
    registerGsap();
    gsap.set(node, { opacity: 0, y: 28, filter: 'blur(10px)' });
    this.trigger = ScrollTrigger.create({
      trigger: node,
      start: 'top 92%',
      once: true,
      onEnter: () => this.animateReveal(),
    });

    const refreshAndTry = (): void => {
      ScrollTrigger.refresh();
      this.tryRevealIfInViewport();
    };

    requestAnimationFrame(refreshAndTry);
    requestAnimationFrame(() => requestAnimationFrame(refreshAndTry));

    this.deferredTimers.push(
      window.setTimeout(refreshAndTry, 400),
      window.setTimeout(refreshAndTry, 900),
    );

    if (typeof window !== 'undefined' && 'onscrollend' in window) {
      this.scrollEndListener = refreshAndTry;
      window.addEventListener('scrollend', this.scrollEndListener, { passive: true });
    }
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
    this.trigger = undefined;
    for (const id of this.deferredTimers) {
      window.clearTimeout(id);
    }
    this.deferredTimers.length = 0;
    if (this.scrollEndListener) {
      window.removeEventListener('scrollend', this.scrollEndListener);
      this.scrollEndListener = undefined;
    }
  }

  private tryRevealIfInViewport(): void {
    if (this.revealed) {
      return;
    }
    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    const topOk = rect.top < vh * 0.94;
    const bottomOk = rect.bottom > -Math.min(120, vh * 0.15);
    if (topOk && bottomOk) {
      this.animateReveal();
    }
  }

  private animateReveal(): void {
    if (this.revealed) {
      return;
    }
    this.revealed = true;
    const node = this.el.nativeElement;
    gsap.to(node, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.78,
      delay: this.appRevealDelay(),
      ease: 'power3.out',
    });
  }
}
