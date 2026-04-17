import { HttpInterceptorFn } from '@angular/common/http';

/** Attach Authorization when auth is implemented */
export const authInterceptor: HttpInterceptorFn = (req, next) => next(req);
