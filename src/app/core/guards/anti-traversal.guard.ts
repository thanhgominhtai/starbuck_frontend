import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const antiTraversalGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  const containsTraversal = (val: unknown): boolean => {
    if (typeof val === 'string') {
      const decoded = decodeURIComponent(val);
      return (
        decoded.includes('..') ||
        decoded.includes('%2e%2e') ||
        decoded.includes('\\') ||
        /\.\.[\/\\]/.test(decoded)
      );
    }
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some((v) => containsTraversal(v));
    }
    return false;
  };

  const hasParamsAttack = containsTraversal(route.params);
  const hasQueryParamsAttack = containsTraversal(route.queryParams);

  if (hasParamsAttack || hasQueryParamsAttack) {
    toast.error('Phát hiện tham số không hợp lệ (Directory Traversal Protection)');
    return router.createUrlTree(['/menu']);
  }

  return true;
};
