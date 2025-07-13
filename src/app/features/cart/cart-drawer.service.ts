import { signal } from '@angular/core';

export class CartDrawerService {
  private isOpenSignal = signal(false);

  isOpen = this.isOpenSignal.asReadonly();

  open() {
    this.isOpenSignal.set(true);
  }

  close() {
    this.isOpenSignal.set(false);
  }

  toggle() {
    this.isOpenSignal.set(!this.isOpenSignal());
  }
} 