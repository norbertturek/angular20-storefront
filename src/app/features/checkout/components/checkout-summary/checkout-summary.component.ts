import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CartTotalsComponent } from '@features/checkout/components/cart-totals/cart-totals.component';
import { DiscountCodeComponent } from '@features/checkout/components/discount-code/discount-code.component';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [CommonModule, RouterModule, CartTotalsComponent, DiscountCodeComponent],
  template: `
    <div class="checkout-summary">
      <div class="summary-header">
        <div class="header-row">
          <h2 class="order-title">
            Order — {{ itemCount }} item{{ itemCount !== 1 ? 's' : '' }}
          </h2>
          <a routerLink="/cart" class="edit-cart-link">
            Edit cart
          </a>
        </div>
      </div>

      <div class="summary-items">
        @for (item of cart.items; track item.id) {
          <div class="cart-item">
            <div class="item-row">
              <a [routerLink]="['/products', item.product_handle]">
                <div class="item-image">
                  @if (getProductImage(item)) {
                    <img 
                      [src]="getProductImage(item)" 
                      [alt]="item.product_title"
                      class="item-img">
                  } @else {
                    <div class="item-placeholder">
                      <span class="placeholder-text">No image</span>
                    </div>
                  }
                </div>
              </a>
              
              <div class="item-details">
                <div class="item-header">
                  <div>
                    <a 
                      [routerLink]="['/products', item.product_handle]" 
                      class="product-link">
                      {{ item.product_title }}
                    </a>
                  </div>
                  <div class="item-price">
                    {{ getItemPrice(item) }}
                  </div>
                </div>
                
                <div class="item-meta">
                  @if (item.variant?.title) {
                    <p class="meta-text">
                      Variant: <span class="meta-value">{{ item.variant.title }}</span>
                    </p>
                  }
                  <p class="meta-text">
                    Quantity: <span class="meta-value">{{ item.quantity }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="summary-footer">
        <app-discount-code [cart]="cart"></app-discount-code>
        <app-cart-totals [cart]="cart"></app-cart-totals>
      </div>
    </div>
  `,
  styles: [`
    .checkout-summary {
      width: 100%;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .order-title {
      font-size: 1.125rem;
      font-weight: 500;
      color: #1f2937;
      margin: 0;
    }

    .edit-cart-link {
      color: #3b82f6;
      font-size: 0.875rem;
      text-decoration: none;
    }

    .edit-cart-link:hover {
      color: #1d4ed8;
    }

    .cart-item {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .cart-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .item-row {
      display: flex;
      gap: 1rem;
    }

    .item-image {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }

    .item-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-placeholder {
      width: 100%;
      height: 100%;
      background-color: #e5e7eb;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-text {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .item-details {
      flex: 1;
      min-width: 0;
    }

    .item-header {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 1rem;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .product-link {
      font-weight: 500;
      color: #1f2937;
      text-decoration: none;
    }

    .product-link:hover {
      color: #3b82f6;
    }

    .item-price {
      font-weight: 500;
      color: #1f2937;
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-text {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .meta-value {
      margin-left: 0.25rem;
    }

    .summary-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    @media (max-width: 640px) {
      .item-image {
        width: 60px;
        height: 60px;
      }
      
      .item-details {
        font-size: 0.875rem;
      }

      .item-header {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class CheckoutSummaryComponent {
  @Input() cart: any;

  get itemCount(): number {
    return this.cart?.items?.length || 0;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  getProductImage(item: any): string | null {
    // Cart items have thumbnail directly
    if (item.thumbnail) {
      return item.thumbnail;
    }
    // Fallback to variant/product structure
    if (item.variant?.product?.thumbnail) {
      return item.variant.product.thumbnail;
    }
    if (item.variant?.product?.images?.[0]?.url) {
      return item.variant.product.images[0].url;
    }
    return null;
  }

  getItemPrice(item: any): string {
    // Cart items have unit_price in cents, multiply by quantity for total
    const unitPrice = item.unit_price || 0;
    const quantity = item.quantity || 1;
    const totalPrice = unitPrice * quantity;
    
    return this.formatPrice(totalPrice);
  }
} 