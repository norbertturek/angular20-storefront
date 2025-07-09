import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-totals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart-totals">
      <div class="totals-lines">
        <div class="total-line">
          <span class="label">Subtotal:</span>
          <span class="value">{{ formatPrice(cart.subtotal || 0) }}</span>
        </div>

        @if (cart.discount_total && cart.discount_total > 0) {
          <div class="total-line">
            <span class="label">Discount:</span>
            <span class="value discount">-{{ formatPrice(cart.discount_total) }}</span>
          </div>
        }

        <div class="total-line">
          <span class="label">Shipping:</span>
          <span class="value">{{ formatPrice(cart.shipping_total || 0) }}</span>
        </div>

        <div class="total-line">
          <span class="label">Taxes:</span>
          <span class="value">{{ formatPrice(cart.tax_total || 0) }}</span>
        </div>

        @if (cart.gift_card_total && cart.gift_card_total > 0) {
          <div class="total-line">
            <span class="label">Gift card:</span>
            <span class="value discount">-{{ formatPrice(cart.gift_card_total) }}</span>
          </div>
        }
      </div>

      <div class="total-divider"></div>

      <div class="total-final">
        <span class="label">Total:</span>
        <span class="value">{{ formatPrice(cart.total || 0) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .cart-totals {
      width: 100%;
    }

    .totals-lines {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .value {
      font-weight: 500;
      color: #1f2937;
    }

    .value.discount {
      color: #059669;
    }

    .total-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 1.5rem 0;
    }

    .total-final {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .total-final .label {
      color: #1f2937;
      font-weight: 600;
    }

    .total-final .value {
      color: #1f2937;
    }
  `]
})
export class CartTotalsComponent {
  @Input() cart: any;

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
} 