import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
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