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

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    if (prefersReducedMotion()) {
      return;
    }
    registerGsap();
    gsap.set(node, { opacity: 0, y: 28, filter: 'blur(10px)' });
    this.trigger = ScrollTrigger.create({
      trigger: node,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        this.revealed = true;
        gsap.to(node, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.78,
          delay: this.appRevealDelay(),
          ease: 'power3.out',
        });
      },
    });

    // Critical for SPA route changes: ensure ScrollTrigger evaluates immediately
    // so above-the-fold elements don't stay invisible until the first scroll.
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();

      if (!this.revealed) {
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight || 0;
        const isInView = rect.top < vh * 0.95 && rect.bottom > 0;
        if (isInView) {
          this.revealed = true;
          gsap.to(node, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.62,
            delay: this.appRevealDelay(),
            ease: 'power3.out',
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
    this.trigger = undefined;
  }
}
