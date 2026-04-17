import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protección por rol admin (mock). Reactivar en rutas cuando exista backend + JWT.
 * Por ahora `/admin` es público en `app.routes.ts`.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user()?.role === 'admin') {
    return true;
  }
  return router.createUrlTree(['/'], { queryParams: { needAdmin: '1' } });
};
