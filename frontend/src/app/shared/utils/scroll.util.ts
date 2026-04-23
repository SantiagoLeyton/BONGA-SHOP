/**
 * Scroll-to-top robusto que maneja todos los casos comunes:
 * - SSR (no hace nada).
 * - Respeta `prefers-reduced-motion`.
 * - Funciona aunque el scroller real sea <html>, <body> o un contenedor custom.
 * - Si el navegador ignora `behavior: 'smooth'` (puede pasar cuando coincide
 *   con `scroll-behavior: smooth` de CSS), hace fallback con animación manual
 *   vía requestAnimationFrame.
 */
export function scrollWindowToTop(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const scroller: HTMLElement =
    (document.scrollingElement as HTMLElement | null) ??
    document.documentElement ??
    document.body;

  const startY = scroller.scrollTop || window.scrollY || window.pageYOffset || 0;

  if (startY <= 0) return;

  if (reduced) {
    scroller.scrollTop = 0;
    window.scrollTo(0, 0);
    return;
  }

  // Intento nativo
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  } catch {
    /* no-op */
  }

  // Fallback animado: si después de un frame seguimos en la misma posición,
  // animamos manualmente. Esto cubre los casos en los que el scroll nativo
  // no se dispara (CSS conflict, contenedores anidados, etc.).
  requestAnimationFrame(() => {
    const stillStuck =
      Math.abs((scroller.scrollTop || window.scrollY || 0) - startY) < 4;

    if (!stillStuck) return;

    const duration = Math.min(700, Math.max(220, startY * 0.6));
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // easeInOutCubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const next = Math.round(startY * (1 - eased));
      scroller.scrollTop = next;
      window.scrollTo(0, next);
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  });
}
