import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-discount-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <button
            type="submit"
            class="apply-button"
            [disabled]="!discountCode.trim() || isApplying()"
          >
            @if (isApplying()) {
              <span class="loading-spinner"></span>
              Applying...
            } @else {
              Apply
            }
          </button>
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

      <!-- Show applied discounts -->
      @if (cart?.promotions && cart.promotions.length > 0) {
        <div class="applied-discounts">
          @for (promotion of cart.promotions; track promotion.id) {
            <div class="discount-item">
              <span class="discount-name">{{ promotion.code || 'Discount' }}</span>
              <button
                type="button"
                class="remove-button"
                (click)="removeDiscount(promotion.code)"
                aria-label="Remove discount"
              >
                ×
              </button>
            </div>
          }
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

    .apply-button {
      padding: 0.75rem 1.5rem;
      background-color: #1f2937;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
    }

    .apply-button:hover:not(:disabled) {
      background-color: #374151;
    }

    .apply-button:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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

    .applied-discounts {
      margin-top: 1rem;
    }

    .discount-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background-color: #f0f9ff;
      border: 1px solid #e0f2fe;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .discount-name {
      font-size: 0.875rem;
      color: #0369a1;
      font-weight: 500;
    }

    .remove-button {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
      padding: 0.25rem;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .remove-button:hover {
      color: #dc2626;
    }
  `]
})
export class DiscountCodeComponent {
  @Input() cart: any;

  private cartService = inject(CartService);

  discountCode = '';
  isApplying = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  async onSubmit() {
    if (!this.discountCode.trim()) return;

    this.isApplying.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.cartService.applyDiscount(this.discountCode.trim());
      this.successMessage.set('Discount code applied successfully!');
      this.discountCode = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
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
      this.successMessage.set('Discount code removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error removing discount code.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        this.errorMessage.set('');
      }, 5000);
    }
  }
} 