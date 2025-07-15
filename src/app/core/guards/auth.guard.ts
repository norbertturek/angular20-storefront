import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@api/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const customer = authService.customer();
  
  if (!customer) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
}; 