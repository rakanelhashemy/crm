import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const inviteGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const { email, token } = route.queryParams;

  if (email && token) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};