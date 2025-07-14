import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';


import { CartService } from '@services/cart.service';
import { ErrorHandlerService } from '@services/error-handler.service';
import { ToastService } from '@services/toast.service';

import { CartDrawerService } from '@features/cart/cart-drawer.service';

import { DiscountCodeComponent } from '@sharedComponents/discount-code/discount-code.component';
import { QuantitySelectorComponent } from '@sharedComponents/quantity-selector/quantity-selector.component';
import { LoadingSpinnerComponent } from '@ui/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '@ui/button/button.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, DiscountCodeComponent, QuantitySelectorComponent, LoadingSpinnerComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      <div class="drawer-header flex justify-between items-center p-4 border-b border-gray-200">
        <h2 class="drawer-title text-lg font-semibold text-primary m-0">Cart</h2>
        <button 
          class="close-button bg-transparent border-none cursor-pointer p-2 text-secondary rounded transition-colors hover:text-primary"
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
            @defer {
              <div class="cart-items">
                @for (item of sortedItems(); track item.id) {
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
                          <app-quantity-selector
                            [initialQuantity]="item.quantity"
                            [maxQuantity]="99"
                            size="small"
                            (quantityChanged)="updateQuantity(item.id, $event)"
                          ></app-quantity-selector>
                          <div class="item-price">
                            {{ (item.unit_price || 0) * item.quantity | currency:'EUR' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @placeholder {
              <div class="cart-items-loading">
                <app-loading-spinner message="Loading cart items..." variant="compact"></app-loading-spinner>
              </div>
            } @loading {
              <div class="cart-items-loading">
                <app-loading-spinner message="Loading cart items..." variant="compact"></app-loading-spinner>
              </div>
            } @error {
              <div class="cart-items-error">
                <p>Failed to load cart items. Please try again.</p>
              </div>
            }

            <!-- Cart Footer -->
            <div class="cart-footer">
              <!-- Cart Totals -->
              <div class="cart-totals">
                <div class="total-line">
                  <span>Subtotal:</span>
                  <span>{{ cart()?.subtotal || 0 | currency:'EUR' }}</span>
                </div>
                @if (cart()!.discount_total && cart()!.discount_total > 0) {
                  <div class="total-line discount-line">
                    <div class="discount-info">
                      @if (cart()?.promotions && cart()?.promotions.length > 0) {
                        <button
                          (click)="removeDiscount(cart()?.promotions[0]?.code)"
                          class="remove-discount-icon"
                          aria-label="Remove discount">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      }
                      <span>
                        @if (cart()?.promotions && cart()?.promotions.length > 0) {
                          Discount ({{ cart()?.promotions[0]?.code }}):
                        } @else {
                          Discount:
                        }
                      </span>
                    </div>
                    <span>-{{ cart()?.discount_total || 0 | currency:'EUR' }}</span>
                  </div>
                }
                @if (cart()!.shipping_total) {
                  <div class="total-line">
                    <span>Shipping:</span>
                    <span>{{ cart()?.shipping_total || 0 | currency:'EUR' }}</span>
                  </div>
                }
                @if (cart()!.tax_total) {
                  <div class="total-line">
                    <span>Tax:</span>
                    <span>{{ cart()?.tax_total || 0 | currency:'EUR' }}</span>
                  </div>
                }
                <div class="total-line final-total">
                  <span>Total:</span>
                                      <span>{{ cart()?.total || 0 | currency:'EUR' }}</span>
                </div>
              </div>

              <!-- Discount Code -->
              <app-discount-code [cart]="cart()"></app-discount-code>

              <!-- Checkout Button -->
              <app-button 
                routerLink="/checkout"
                (clicked)="cartDrawerService.close()"
                label="Proceed to checkout"
                variant="primary"
                size="small"
                class="checkout-button">
              </app-button>
            </div>
          } @else {
            <!-- Empty Cart -->
            <div class="empty-cart">
              <p class="empty-message">
                You don't have anything in your cart. Let's change that!
              </p>
              <a 
                routerLink="/products" 
                class="shop-link"
                (click)="cartDrawerService.close()">
                Explore products
              </a>
            </div>
          }
        } @else {
          <!-- Loading -->
          <div class="loading-state">
            <app-loading-spinner message="Loading cart..." variant="compact"></app-loading-spinner>
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
      /* Styles handled by utility classes */
    }

    .drawer-title {
      /* Styles handled by utility classes */
    }

    .close-button {
      /* Styles handled by utility classes */
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
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
    }

    .item-price {
      font-weight: 600;
      color: #1f2937;
      font-size: 1rem;
      text-align: right;
      flex-shrink: 0;
    }

    .checkout-button {
      width: 100% !important;
      display: block !important;
    }

    .checkout-button ::ng-deep .button {
      width: 100% !important;
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

    .discount-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .remove-discount-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      color: #6b7280;
      border-radius: 4px;
      transition: color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .remove-discount-icon:hover {
      color: #dc2626;
    }

    .final-total {
      font-weight: 600;
      font-size: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
      margin-top: 0.5rem;
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

    .cart-items-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      min-height: 200px;
    }

    .cart-items-error {
      text-align: center;
      padding: 2rem;
      color: #dc2626;
      font-size: 0.9rem;
    }

    /* Mobile adjustments */
    @media (max-width: 640px) {
      .cart-drawer {
        max-width: 100%;
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
  // Services
  readonly cartDrawerService = inject(CartDrawerService);
  private readonly cartService = inject(CartService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly toastService = inject(ToastService);

  // State signals
  readonly cart = signal<any>(null);

  // Computed property
  readonly sortedItems = computed(() => {
    return [...this.cart()!.items].sort((a, b) => a.id.localeCompare(b.id));
  });

  constructor() {
    // Effects
    effect(() => {
      const isOpen = this.cartDrawerService.isOpen();
      if (isOpen) {
        this.cartService.retrieveCart();
      }
    });

    effect(() => {
      const cart = this.cartService.cart();
      this.cart.set(cart);
    });
  }

  // Public methods
  async updateQuantity(lineId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeItem(lineId);
      return;
    }

    try {
      await this.cartService.updateLineItem(lineId, quantity);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        component: 'CartDrawer',
        action: 'updateQuantity'
      });
    }
  }

  async removeItem(lineId: string): Promise<void> {
    try {
      await this.cartService.removeLineItem(lineId);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        component: 'CartDrawer',
        action: 'removeItem'
      });
    }
  }

  async removeDiscount(promotionCode: string): Promise<void> {
    try {
      await this.cartService.removeDiscount(promotionCode);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        component: 'CartDrawer',
        action: 'removeDiscount'
      });
    }
  }
} 