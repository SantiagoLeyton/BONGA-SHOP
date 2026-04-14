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

export type VaporInteraction = 'scroll' | 'drag';

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

  /** How the user controls the sequence */
  readonly interaction = input<VaporInteraction>('scroll');

  /** Total scroll “length” of this section (larger = slower frame changes). */
  readonly scrollVh = input(420);

  /** ScrollTrigger scrub lag (0 = jumpy, 1 = very smooth). */
  readonly scrub = input(0.55);

  /** Drag sensitivity: pixels needed to advance 1 frame. */
  readonly pxPerFrame = input(10);

  /** Loop frames when dragging (best for 360° rotations). */
  readonly loop = input(true);

  /** When true and user prefers reduced motion: static first frame, short block. */
  readonly respectReducedMotion = input(true);

  /** Only load frames when mounted (useful if you render this conditionally) */
  readonly preload = input(true);

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
  private removeDragListeners?: () => void;

  readonly isDragging = signal(false);
  private dragStartX = 0;
  private dragStartIndex = 0;

  private readonly canvasEl = signal<HTMLCanvasElement | null>(null);
  private frameImages: HTMLImageElement[] = [];
  private rafDraw = 0;

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
    if (this.preload()) {
      this.preloadFrames();
    }
    const root = this.host.nativeElement;

    if (this.interaction() === 'scroll') {
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
    } else {
      this.setupDrag(root);
    }
  }

  private urlForFrame(index: number): string {
    const n = index + 1;
    const pad = String(n).padStart(4, '0');
    return `/${this.basePath()}/${pad}.${this.extension()}`;
  }

  private setupDrag(root: HTMLElement): void {
    const target = root.querySelector<HTMLElement>('[data-drag-target]');
    if (!target) {
      return;
    }

    const canvas = target.querySelector('canvas') as HTMLCanvasElement | null;
    this.setCanvas(canvas);

    if (!this.frameImages.length) {
      // Ensure at least current frame is available in drag mode.
      this.preloadFrames();
    }

    this.drawFrameToCanvas();

    const onDown = (e: PointerEvent) => {
      if (this.useStaticReduced()) {
        return;
      }
      this.isDragging.set(true);
      this.dragStartX = e.clientX;
      this.dragStartIndex = this.frameIndex();
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!this.isDragging()) {
        return;
      }
      const dx = e.clientX - this.dragStartX;
      const framesDelta = Math.round(dx / Math.max(1, this.pxPerFrame()));
      this.setFrame(this.dragStartIndex + framesDelta);
      this.drawFrameToCanvas();
    };

    const onUp = () => {
      this.isDragging.set(false);
    };

    target.addEventListener('pointerdown', onDown, { passive: true });
    target.addEventListener('pointermove', onMove, { passive: true });
    target.addEventListener('pointerup', onUp, { passive: true });
    target.addEventListener('pointercancel', onUp, { passive: true });
    target.addEventListener('pointerleave', onUp, { passive: true });

    this.removeDragListeners = () => {
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      target.removeEventListener('pointerleave', onUp);
    };
  }

  private setFrame(index: number): void {
    const count = this.frameCount();
    if (count <= 0) {
      this.frameIndex.set(0);
      return;
    }

    if (this.loop()) {
      const mod = ((index % count) + count) % count;
      this.frameIndex.set(mod);
      return;
    }

    this.frameIndex.set(Math.min(count - 1, Math.max(0, index)));
  }

  private preloadFrames(): void {
    const count = this.frameCount();
    this.frameImages = [];
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = this.urlForFrame(i);
      img.decoding = 'async';
      this.frameImages.push(img);
    }
  }

  /** Bound from template for the drag mode canvas element. */
  setCanvas(el: HTMLCanvasElement | null): void {
    this.canvasEl.set(el);
    this.drawFrameToCanvas();
  }

  private drawFrameToCanvas(): void {
    if (this.interaction() !== 'drag') {
      return;
    }
    if (this.broken()) {
      return;
    }

    const canvas = this.canvasEl();
    if (!canvas) {
      return;
    }

    const idx = this.frameIndex();
    const img = this.frameImages[idx];
    if (!img) {
      return;
    }

    if (this.rafDraw) {
      cancelAnimationFrame(this.rafDraw);
    }

    this.rafDraw = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w === 0 || h === 0) {
        // Not decoded yet; try again soon.
        this.drawFrameToCanvas();
        return;
      }

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, w, h);
    });
  }

  onImgError(): void {
    this.broken.set(true);
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.scrollTrigger = undefined;
    this.removeDragListeners?.();
    this.removeDragListeners = undefined;
    if (this.rafDraw) {
      cancelAnimationFrame(this.rafDraw);
      this.rafDraw = 0;
    }
  }
}
