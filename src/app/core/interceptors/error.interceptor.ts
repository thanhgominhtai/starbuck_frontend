import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't intercept auth signin / signup / refresh error loops
      if (req.url.includes('/auth/signin') || req.url.includes('/auth/signup')) {
        const msg = error.error?.message || 'Đăng nhập hoặc đăng ký thất bại';
        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        return throwError(() => error);
      }

      // [FE-03] Auto redirect when 401 token expired
      if (error.status === 401) {
        if (!req.url.includes('/auth/refresh') && authService.getRefreshToken()) {
          return authService.refreshToken().pipe(
            switchMap((newRes) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newRes.accessToken}`,
                },
              });
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              authService.clearSession();
              toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại (FE-03)');
              router.navigate(['/auth']);
              return throwError(() => refreshErr);
            }),
          );
        } else {
          authService.clearSession();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại (FE-03)');
          router.navigate(['/auth']);
        }
      } else if (error.status === 403) {
        toast.error('Bạn không có quyền thực hiện hành động này (403 Forbidden)');
      } else if (error.status >= 500) {
        toast.error('Hệ thống máy chủ đang bận, vui lòng thử lại sau', 'Lỗi máy chủ');
      } else if (error.status === 400) {
        const msg = error.error?.message || 'Yêu cầu không hợp lệ';
        const displayMsg = Array.isArray(msg) ? msg.join(', ') : msg;
        toast.error(displayMsg, 'Thông tin không hợp lệ');
      }

      return throwError(() => error);
    }),
  );
};
