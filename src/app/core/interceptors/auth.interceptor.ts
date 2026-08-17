import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  // If request is to our backend and we have token, attach it
  const isBackendReq =
    !req.url.startsWith('http') ||
    req.url.startsWith('/') ||
    (environment.apiUrl && req.url.includes(environment.apiUrl)) ||
    req.url.includes('localhost:3000');

  if (token && isBackendReq) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
