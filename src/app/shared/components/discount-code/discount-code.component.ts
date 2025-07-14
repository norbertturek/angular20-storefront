import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { inject } from '@angular/core';
import { CartService } from '@services/cart.service';
import { ToastService } from '@services/toast.service';

import { ButtonComponent } from '@ui/button/button.component';

@Component({
  selector: 'app-discount-code',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="discount-code">
      <form (ngSubmit)="onSubmit()" class="discount-form">
        <div class="input-group">
          <input
            type="text"
            [(ngModel)]="discountCode"
            name="discountCode"
            placeholder="Discount code"
            class="discount-input"
            [disabled]="isApplying()"
          />
          <app-button
            [type]="'submit'"
            [disabled]="!discountCode.trim() || isApplying()"
            [loading]="isApplying()"
            label="Apply"
            variant="primary"
            size="small"
            class="apply-button">
          </app-button>
        </div>
      </form>

      @if (errorMessage()) {
        <div class="error-message">
          {{ errorMessage() }}
        </div>
      }

      @if (successMessage()) {
        <div class="success-message">
          {{ successMessage() }}
        </div>
      }


    </div>
  `,
  styles: [`
    .discount-code {
      margin-bottom: 1.5rem;
    }

    .discount-form {
      margin-bottom: 1rem;
    }

    .input-group {
      display: flex;
      gap: 0.5rem;
    }

    .discount-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .discount-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .discount-input:disabled {
      background-color: #f9fafb;
      cursor: not-allowed;
    }



    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .success-message {
      color: #059669;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }




  `]
})
export class DiscountCodeComponent {
  cart = input<any>();

  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  discountCode = '';
  isApplying = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  async onSubmit() {
    if (!this.discountCode.trim()) return;

    // Check if discount code is already applied
    const currentPromotions = this.cart()?.promotions || [];
    const isAlreadyApplied = currentPromotions.some(
      (promotion: any) => promotion.code?.toLowerCase() === this.discountCode.trim().toLowerCase()
    );

    if (isAlreadyApplied) {
      this.toastService.error('This discount code is already applied.');
      return;
    }

    this.isApplying.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.cartService.applyDiscount(this.discountCode.trim());
      this.discountCode = '';
    } catch (error: any) {
      // Toast will be shown by CartService
      this.errorMessage.set(error.message || 'Invalid discount code. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        this.errorMessage.set('');
      }, 5000);
    } finally {
      this.isApplying.set(false);
    }
  }

  async removeDiscount(promotionCode: string) {
    try {
      await this.cartService.removeDiscount(promotionCode);
      // Toast will be shown by CartService
      this.successMessage.set('Discount code removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      // Toast will be shown by CartService
      this.errorMessage.set(error.message || 'Error removing discount code.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        this.errorMessage.set('');
      }, 5000);
    }
  }
} 