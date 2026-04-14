import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, registerGsap } from '../../animation/register-gsap';

/**
 * Scroll-scrubbed frame sequence (e.g. 64 renders) for a pseudo-3D vape rotation.
 * Drop files under /public: default folder `assets/frames/vape/` named 0001…0064 + extension.
 */
@Component({
  selector: 'app-vapor-frame-scrub',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vapor-frame-scrub.component.html',
  styleUrl: './vapor-frame-scrub.component.scss',
})
export class VaporFrameScrubComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Path under `public/` without leading slash, e.g. `assets/frames/vape` */
  readonly basePath = input('assets/frames/vape');

  readonly frameCount = input(64);
  readonly extension = input('png');

  /** Total scroll “length” of this section (larger = slower frame changes). */
  readonly scrollVh = input(420);

  /** ScrollTrigger scrub lag (0 = jumpy, 1 = very smooth). */
  readonly scrub = input(0.55);

  /** When true and user prefers reduced motion: static first frame, short block. */
  readonly respectReducedMotion = input(true);

  readonly fallbackSrc = input('/assets/hero-vapor.svg');

  readonly frameIndex = signal(0);

  readonly broken = signal(false);

  readonly imageUrl = computed(() => this.urlForFrame(this.frameIndex()));

  readonly progress = computed(() => {
    const max = this.frameCount() - 1;
    if (max <= 0) {
      return 0;
    }
    return this.frameIndex() / max;
  });

  readonly useStaticReduced = signal(false);

  private scrollTrigger?: ScrollTrigger;

  constructor() {
    afterNextRender(() => this.setup());
  }

  private setup(): void {
    const reduced = this.respectReducedMotion() && prefersReducedMotion();
    this.useStaticReduced.set(reduced);
    if (reduced) {
      this.frameIndex.set(0);
      return;
    }
    registerGsap();
    this.preloadFrames();
    const root = this.host.nativeElement;
    this.scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: this.scrub(),
      onUpdate: (self) => {
        const max = this.frameCount() - 1;
        const idx = Math.round(self.progress * max);
        this.frameIndex.set(Math.min(max, Math.max(0, idx)));
      },
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  private urlForFrame(index: number): string {
    const n = index + 1;
    const pad = String(n).padStart(4, '0');
    return `/${this.basePath()}/${pad}.${this.extension()}`;
  }

  private preloadFrames(): void {
    const count = this.frameCount();
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = this.urlForFrame(i);
    }
  }

  onImgError(): void {
    this.broken.set(true);
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.scrollTrigger = undefined;
  }
}
