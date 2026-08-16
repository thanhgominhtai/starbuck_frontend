import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  // [AD-00] Restrict admin pages to users with ADMIN role only
  toast.error('Bạn không có quyền truy cập khu vực Quản trị viên (Admin)');
  return router.createUrlTree(['/menu']);
};
