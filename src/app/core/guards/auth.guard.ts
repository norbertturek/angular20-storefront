import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@api/auth.service';

export const authGuard = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Przywróć dane z localStorage jeśli są puste
  authService.restoreFromStorageIfNeeded();
  
  const customer = authService.customer();
  
  if (!customer) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};

export const noAuthGuard = (): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Przywróć dane z localStorage jeśli są puste
  authService.restoreFromStorageIfNeeded();
  
  const customer = authService.customer();
  
  if (customer) {
    router.navigate(['/account']);
    return false;
  }
  
  return true;
}; 