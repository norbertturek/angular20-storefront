import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-totals',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cart-totals">
      <div class="totals-lines">
        <div class="total-line">
          <span class="label">Subtotal:</span>
          <span class="value">{{ cart()?.subtotal || 0 | currency:'EUR' }}</span>
        </div>

        @if (cart()?.discount_total && cart()?.discount_total > 0) {
          <div class="total-line">
            <span class="label">Discount:</span>
            <span class="value discount">-{{ cart()?.discount_total | currency:'EUR' }}</span>
          </div>
        }

        <div class="total-line">
          <span class="label">Shipping:</span>
          <span class="value">{{ cart()?.shipping_total || 0 | currency:'EUR' }}</span>
        </div>

        <div class="total-line">
          <span class="label">Taxes:</span>
          <span class="value">{{ cart()?.tax_total || 0 | currency:'EUR' }}</span>
        </div>

        @if (cart()?.gift_card_total && cart()?.gift_card_total > 0) {
          <div class="total-line">
            <span class="label">Gift card:</span>
            <span class="value discount">-{{ cart()?.gift_card_total | currency:'EUR' }}</span>
          </div>
        }
      </div>

      <div class="total-divider"></div>

      <div class="total-final">
        <span class="label">Total:</span>
        <span class="value">{{ cart()?.total || 0 | currency:'EUR' }}</span>
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
  cart = input<any>();
} 