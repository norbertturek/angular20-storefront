import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartDrawerService } from '@core/services/cart-drawer.service';
import { CartService } from '@core/services/cart.service';
import { DiscountCodeComponent } from '@features/checkout/components/discount-code/discount-code.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, DiscountCodeComponent],
  template: `
    <!-- Backdrop -->
    @if (cartDrawerService.isOpen()) {
      <div 
        class="cart-drawer-backdrop"
        (click)="cartDrawerService.close()">
      </div>
    }

    <!-- Drawer -->
    <div 
      class="cart-drawer"
      [class.open]="cartDrawerService.isOpen()">
      
      <!-- Header -->
      <div class="drawer-header">
        <h2 class="drawer-title">Cart</h2>
        <button 
          class="close-button"
          (click)="cartDrawerService.close()"
          aria-label="Close cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="drawer-content">
        @if (cart()) {
          @if (cart()!.items && cart()!.items.length > 0) {
            <!-- Cart Items -->
            <div class="cart-items">
              @for (item of cart()!.items; track item.id) {
                <div class="cart-item">
                  <div class="item-content">
                    <a [routerLink]="['/products', item.product_handle]" 
                       (click)="cartDrawerService.close()">
                      <div class="item-image">
                        @if (item.thumbnail) {
                          <img 
                            [src]="item.thumbnail" 
                            [alt]="item.product_title"
                            class="product-image">
                        } @else {
                          <div class="image-placeholder">
                            <span>No image</span>
                          </div>
                        }
                      </div>
                    </a>
                    
                    <div class="item-details">
                      <div class="item-header">
                        <a 
                          [routerLink]="['/products', item.product_handle]"
                          class="product-title"
                          (click)="cartDrawerService.close()">
                          {{ item.product_title }}
                        </a>
                        <div class="item-actions">
                          <button 
                            class="remove-button"
                            (click)="removeItem(item.id)"
                            aria-label="Remove item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      @if (item.variant_title) {
                        <p class="variant-title">{{ item.variant_title }}</p>
                      }
                      
                      <div class="item-footer">
                        <div class="quantity-controls">
                          <button 
                            class="quantity-btn"
                            (click)="updateQuantity(item.id, item.quantity - 1)"
                            [disabled]="item.quantity <= 1">
                            -
                          </button>
                          <span class="quantity">{{ item.quantity }}</span>
                          <button 
                            class="quantity-btn"
                            (click)="updateQuantity(item.id, item.quantity + 1)">
                            +
                          </button>
                        </div>
                        <div class="item-price">
                          {{ formatPrice((item.unit_price || 0) * item.quantity) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Cart Footer -->
            <div class="cart-footer">
              <!-- Cart Totals -->
              <div class="cart-totals">
                <div class="total-line">
                  <span>Subtotal:</span>
                  <span>{{ formatPrice(cart()!.subtotal || 0) }}</span>
                </div>
                @if (cart()!.discount_total && cart()!.discount_total > 0) {
                  <div class="total-line discount-line">
                    <span>Discount:</span>
                    <span>-{{ formatPrice(cart()!.discount_total) }}</span>
                  </div>
                }
                @if (cart()!.shipping_total) {
                  <div class="total-line">
                    <span>Shipping:</span>
                    <span>{{ formatPrice(cart()!.shipping_total) }}</span>
                  </div>
                }
                @if (cart()!.tax_total) {
                  <div class="total-line">
                    <span>Tax:</span>
                    <span>{{ formatPrice(cart()!.tax_total) }}</span>
                  </div>
                }
                <div class="total-line final-total">
                  <span>Total:</span>
                  <span>{{ formatPrice(cart()!.total || 0) }}</span>
                </div>
              </div>

              <!-- Discount Code -->
              <app-discount-code [cart]="cart()"></app-discount-code>

              <!-- Checkout Button -->
              <button 
                class="checkout-button"
                [routerLink]="['/checkout']"
                (click)="cartDrawerService.close()">
                Proceed to checkout
              </button>
            </div>
          } @else {
            <!-- Empty Cart -->
            <div class="empty-cart">
              <p class="empty-message">
                You don't have anything in your cart. Let's change that!
              </p>
              <a 
                routerLink="/store" 
                class="shop-link"
                (click)="cartDrawerService.close()">
                Explore products
              </a>
            </div>
          }
        } @else {
          <!-- Loading -->
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading cart...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cart-drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .cart-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 400px;
      background-color: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    }

    .cart-drawer.open {
      transform: translateX(0);
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .drawer-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      color: #6b7280;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .close-button:hover {
      color: #1f2937;
    }

    .drawer-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.5rem;
    }

    .cart-item {
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .cart-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .item-content {
      display: flex;
      gap: 1rem;
    }

    .item-image {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      background-color: #f3f4f6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .product-title {
      font-weight: 500;
      color: #1f2937;
      text-decoration: none;
      line-height: 1.4;
    }

    .product-title:hover {
      color: #3b82f6;
    }

    .remove-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      color: #6b7280;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .remove-button:hover {
      color: #dc2626;
    }

    .variant-title {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    .quantity-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: background-color 0.2s;
    }

    .quantity-btn:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity {
      padding: 0.5rem;
      min-width: 40px;
      text-align: center;
      font-size: 0.875rem;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
    }

    .item-price {
      font-weight: 500;
      color: #1f2937;
    }

    .cart-footer {
      border-top: 1px solid #e5e7eb;
      padding: 1.5rem;
    }

    .cart-totals {
      margin-bottom: 1.5rem;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .total-line:last-child {
      margin-bottom: 0;
    }

    .discount-line {
      color: #059669;
    }

    .discount-line span:last-child {
      color: #059669;
      font-weight: 500;
    }

    .final-total {
      font-weight: 600;
      font-size: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
      margin-top: 0.5rem;
    }

    .checkout-button {
      width: 100%;
      background-color: #1f2937;
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      text-decoration: none;
      display: block;
      text-align: center;
    }

    .checkout-button:hover {
      background-color: #374151;
    }

    .empty-cart {
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-message {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .shop-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .shop-link:hover {
      color: #2563eb;
      text-decoration: underline;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Mobile adjustments */
    @media (max-width: 640px) {
      .cart-drawer {
        max-width: 100%;
      }
      
      .drawer-header {
        padding: 1rem;
      }
      
      .cart-items {
        padding: 1rem;
      }
      
      .cart-footer {
        padding: 1rem;
      }
      
      .item-image {
        width: 60px;
        height: 60px;
      }
    }
  `  ]
})
export class CartDrawerComponent {
  cartDrawerService = inject(CartDrawerService);
  private cartService = inject(CartService);

  cart = signal<any>(null);

  constructor() {
    // Watch for drawer state changes - effect needs to be in constructor
    effect(() => {
      const isOpen = this.cartDrawerService.isOpen();
      if (isOpen && !this.cart()) {
        this.cartService.retrieveCart();
      }
    });

    // Use effect to reactively update cart when cart service changes
    effect(() => {
      const cart = this.cartService.cart();
      this.cart.set(cart);
    });
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  async updateQuantity(lineId: string, quantity: number) {
    if (quantity <= 0) {
      await this.removeItem(lineId);
      return;
    }

    try {
      await this.cartService.updateLineItem(lineId, quantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  async removeItem(lineId: string) {
    try {
      await this.cartService.removeLineItem(lineId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }
} 