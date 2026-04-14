import { animate, query, style, transition, trigger } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'fixed', inset: 0 }), { optional: true }),
    query(':leave', [animate('220ms ease-in', style({ opacity: 0, transform: 'translateY(6px)' }))], {
      optional: true,
    }),
    query(':enter', [style({ opacity: 0, transform: 'translateY(10px)' })], { optional: true }),
    query(':enter', [animate('320ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'none' }))], {
      optional: true,
    }),
  ]),
]);

