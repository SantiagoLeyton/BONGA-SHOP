import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthed()) {
    return router.createUrlTree(['/'], {
      queryParams: {
        redirectTo: state.url,
        login: '1',
      },
    });
  }

  if (auth.user()?.role === 'admin') {
    return true;
  }

  return router.createUrlTree(['/'], {
    queryParams: {
      needAdmin: '1',
    },
  });
};
