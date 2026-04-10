import { CanActivateFn } from '@angular/router';

/** Prepared for admin role checks */
export const adminGuard: CanActivateFn = () => true;
