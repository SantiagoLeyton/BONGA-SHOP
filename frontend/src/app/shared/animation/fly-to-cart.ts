export function flyToCart(imageUrl: string): void {
  const target = document.getElementById('cart-btn');
  if (!target) return;
  const tr = target.getBoundingClientRect();

  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.left = '50%';
  el.style.top = '55%';
  el.style.width = '56px';
  el.style.height = '70px';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.borderRadius = '16px';
  el.style.border = '1px solid rgba(148, 163, 184, 0.18)';
  el.style.boxShadow = '0 18px 55px rgba(2, 6, 23, 0.45)';
  el.style.background = `url(${imageUrl}) center / cover no-repeat, rgba(2,6,23,.35)`;
  el.style.zIndex = '200';
  el.style.pointerEvents = 'none';

  document.body.appendChild(el);

  const keyframes: Keyframe[] = [
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
    {
      transform: `translate(${tr.left + tr.width / 2}px, ${tr.top + tr.height / 2}px) scale(0.15)`,
      opacity: 0.35,
    },
  ];

  // Web Animations API
  const anim = el.animate(keyframes, {
    duration: 620,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  });
  anim.onfinish = () => el.remove();
}

