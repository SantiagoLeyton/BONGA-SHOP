import { CanActivateFn } from '@angular/router';

/** Prepared for JWT — allow all routes until auth is wired */
export const authGuard: CanActivateFn = () => true;
