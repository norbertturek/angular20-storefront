import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpTypes } from '@medusajs/types';
import { CartService } from '../../core/services/cart.service';
import { DiscountCodeComponent } from './components/discount-code/discount-code.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DiscountCodeComponent],
  template: `
    <div class="checkout-container" [class.is-loading]="isLoading()">
      <div class="checkout-content">
        <h1>Checkout</h1>
        
        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="error-message">
            <p>{{ errorMessage() }}</p>
          </div>
        }
        
        <!-- Step 1: Email -->
        <div class="step-section">
          <div class="step-header">
            <h2 [class.active]="currentStep() === 'email'">1. Contact information</h2>
            @if (currentStep() !== 'email' && cart()?.email) {
              <button class="edit-btn" (click)="goToStep('email')">Edit</button>
            }
          </div>
          
          @if (currentStep() === 'email') {
            <div class="step-content">
              <div class="form-group">
                <label for="email">Email address</label>
                <input 
                  type="email" 
                  id="email" 
                  [(ngModel)]="emailForm.email"
                  placeholder="Enter your email"
                  required
                >
              </div>
              <button 
                class="continue-btn" 
                (click)="submitEmail()"
                [disabled]="!emailForm.email || isLoading()"
              >
                @if (isLoading()) {
                  <span class="loading-spinner"></span>
                }
                Continue to delivery
              </button>
            </div>
          } @else if (cart()?.email) {
            <div class="step-summary">
              <p>{{ cart()?.email }}</p>
            </div>
          }
        </div>

        <!-- Step 2: Delivery Address -->
        <div class="step-section">
          <div class="step-header">
            <h2 [class.active]="currentStep() === 'delivery'">2. Delivery details</h2>
            @if (currentStep() !== 'delivery' && cart()?.shipping_address) {
              <button class="edit-btn" (click)="goToStep('delivery')">Edit</button>
            }
          </div>
          
          @if (currentStep() === 'delivery') {
            <div class="step-content">
              <h3>Shipping Address</h3>
              <div class="address-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="first_name">First Name</label>
                    <input 
                      type="text" 
                      id="first_name" 
                      [(ngModel)]="addressForm.shipping_address.first_name"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="last_name">Last Name</label>
                    <input 
                      type="text" 
                      id="last_name" 
                      [(ngModel)]="addressForm.shipping_address.last_name"
                      required
                    >
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="address_1">Address</label>
                  <input 
                    type="text" 
                    id="address_1" 
                    [(ngModel)]="addressForm.shipping_address.address_1"
                    required
                  >
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="city">City</label>
                    <input 
                      type="text" 
                      id="city" 
                      [(ngModel)]="addressForm.shipping_address.city"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="postal_code">Postal Code</label>
                    <input 
                      type="text" 
                      id="postal_code" 
                      [(ngModel)]="addressForm.shipping_address.postal_code"
                      required
                    >
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="country_code">Country</label>
                  <select 
                    id="country_code" 
                    [(ngModel)]="addressForm.shipping_address.country_code"
                    required
                  >
                    <option value="">Select a country</option>
                    <option value="dk">Denmark</option>
                    <option value="de">Germany</option>
                    <option value="fr">France</option>
                    <option value="gb">United Kingdom</option>
                    <option value="hr">Croatia</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="phone">Phone</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    [(ngModel)]="addressForm.shipping_address.phone"
                  >
                </div>
              </div>
              
              <div class="billing-section">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="sameAsBilling"
                    (change)="onSameAsBillingChange()"
                  >
                  Billing address is the same as shipping address
                </label>
                
                @if (!sameAsBilling) {
                  <div class="billing-form">
                    <h3>Billing Address</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="billing_first_name">First Name</label>
                        <input 
                          type="text" 
                          id="billing_first_name" 
                          [(ngModel)]="addressForm.billing_address.first_name"
                          required
                        >
                      </div>
                      <div class="form-group">
                        <label for="billing_last_name">Last Name</label>
                        <input 
                          type="text" 
                          id="billing_last_name" 
                          [(ngModel)]="addressForm.billing_address.last_name"
                          required
                        >
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label for="billing_address_1">Address</label>
                      <input 
                        type="text" 
                        id="billing_address_1" 
                        [(ngModel)]="addressForm.billing_address.address_1"
                        required
                      >
                    </div>
                    
                    <div class="form-row">
                      <div class="form-group">
                        <label for="billing_city">City</label>
                        <input 
                          type="text" 
                          id="billing_city" 
                          [(ngModel)]="addressForm.billing_address.city"
                          required
                        >
                      </div>
                      <div class="form-group">
                        <label for="billing_postal_code">Postal Code</label>
                        <input 
                          type="text" 
                          id="billing_postal_code" 
                          [(ngModel)]="addressForm.billing_address.postal_code"
                          required
                        >
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label for="billing_country_code">Country</label>
                      <select 
                        id="billing_country_code" 
                        [(ngModel)]="addressForm.billing_address.country_code"
                        required
                      >
                        <option value="">Select a country</option>
                        <option value="dk">Denmark</option>
                        <option value="de">Germany</option>
                        <option value="fr">France</option>
                        <option value="gb">United Kingdom</option>
                        <option value="hr">Croatia</option>
                      </select>
                    </div>
                  </div>
                }
                
                <button 
                  class="continue-btn" 
                  (click)="submitAddresses()"
                  [disabled]="!isAddressFormValid() || isLoading()"
                >
                  @if (isLoading()) {
                    <span class="loading-spinner"></span>
                  }
                  Continue to shipping
                </button>
              </div>
            </div>
          } @else if (cart()?.shipping_address) {
            <div class="step-summary">
              <p>{{ cart()?.shipping_address?.address_1 }}, {{ cart()?.shipping_address?.city }}</p>
            </div>
          }
        </div>

        <!-- Step 3: Shipping -->
        <div class="step-section">
          <div class="step-header">
            <h2 [class.active]="currentStep() === 'shipping'">3. Shipping method</h2>
            @if (currentStep() !== 'shipping' && cart()?.shipping_methods?.length) {
              <button class="edit-btn" (click)="goToStep('shipping')">Edit</button>
            }
          </div>
          
          @if (currentStep() === 'shipping') {
            <div class="step-content">
              <h3>Choose shipping method</h3>
              
              <!-- Debug info for shipping -->
              @if (cart()?.shipping_address) {
                <div class="debug-info">
                  <p><strong>Shipping to:</strong> {{ cart()?.shipping_address?.address_1 }}, {{ cart()?.shipping_address?.city }}, {{ cart()?.shipping_address?.postal_code }}, {{ cart()?.shipping_address?.country_code }}</p>
                </div>
              }
              
              @if (shippingOptions().length > 0) {
                <div class="shipping-options">
                  @for (option of shippingOptions(); track option.id) {
                    <label class="shipping-option">
                      <input 
                        type="radio" 
                        name="shipping" 
                        [value]="option.id"
                        [(ngModel)]="selectedShippingOption"
                      >
                      <span class="option-name">{{ option.name }}</span>
                      <span class="option-price">{{ formatPrice(option.amount) }}</span>
                    </label>
                  }
                </div>
                <button 
                  class="continue-btn" 
                  (click)="submitShippingMethod()"
                  [disabled]="!selectedShippingOption || isLoading()"
                >
                  @if (isLoading()) {
                    <span class="loading-spinner"></span>
                  }
                  Continue to payment
                </button>
              } @else {
                <div class="no-shipping-options">
                  <p class="error-text">No shipping options available for your address.</p>
                  <p>Please check your address details or contact us for assistance.</p>
                  <button class="edit-btn" (click)="goToStep('delivery')">Edit Address</button>
                </div>
              }
            </div>
          } @else if (cart()?.shipping_methods?.length) {
            <div class="step-summary">
              <p>{{ getSelectedShippingMethodName() }} - {{ formatPrice(cart()?.shipping_methods?.[0]?.amount || 0) }}</p>
            </div>
          }
        </div>

        <!-- Step 4: Payment -->
        <div class="step-section">
          <div class="step-header">
            <h2 [class.active]="currentStep() === 'payment'">4. Payment</h2>
             @if (currentStep() !== 'payment' && cart()?.payment_collection) {
              <button class="edit-btn" (click)="goToStep('payment')">Edit</button>
            }
          </div>
           @if (currentStep() === 'payment') {
            <div class="step-content">
              <h3>Payment methods</h3>
              <p>Payment methods will be implemented here</p>

              <button
                class="continue-btn"
                (click)="submitPayment()"
              >
                Continue to review
              </button>
            </div>
          }
        </div>

        <!-- Step 5: Review -->
        <div class="step-section">
          <div class="step-header">
            <h2 [class.active]="currentStep() === 'review'">5. Review</h2>
          </div>
           @if (currentStep() === 'review') {
            <div class="step-content">
              <h3>Review your order</h3>
              <p>Everything looks good? Place your order now!</p>
              <button 
                class="continue-btn" 
                (click)="placeOrder()"
                [disabled]="isLoading()"
              >
                @if (isLoading()) {
                  <span class="loading-spinner"></span>
                }
                Place Order
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Enhanced Order Summary -->
      <div class="checkout-summary">
        <div class="summary-header">
          <h2>Order Summary</h2>
          <p class="item-count">{{ cart()?.items?.length || 0 }} item{{ (cart()?.items?.length || 0) > 1 ? 's' : '' }}</p>
        </div>
        
        <!-- Product Items -->
        <div class="summary-items">
          @for (item of cart()?.items; track item.id) {
            <div class="summary-item">
              <div class="item-content">
                <a [routerLink]="['/products', item.product_handle]">
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
                      class="product-title">
                      {{ item.product_title }}
                    </a>
                  </div>
                  
                  @if (item.variant_title) {
                    <p class="variant-title">{{ item.variant_title }}</p>
                  }
                  
                  <div class="item-footer">
                    <div class="quantity-display">
                      <span class="quantity">Qty: {{ item.quantity }}</span>
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
        
        <!-- Discount Code -->
        <app-discount-code [cart]="cart()"></app-discount-code>
        
        <!-- Cart Totals -->
        <div class="cart-totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>{{ formatPrice(cart()?.subtotal || 0) }}</span>
          </div>
          
          @if (cart()?.discount_total && (cart()?.discount_total || 0) > 0) {
            <div class="total-row discount">
              <span>Discount:</span>
              <span>-{{ formatPrice(cart()?.discount_total || 0) }}</span>
            </div>
          }
          
          <div class="total-row">
            <span>Shipping:</span>
            <span>{{ formatPrice(cart()?.shipping_total || 0) }}</span>
          </div>
          
          <div class="total-row">
            <span>Taxes:</span>
            <span>{{ formatPrice(cart()?.tax_total || 0) }}</span>
          </div>
          
          @if ((cart()?.gift_card_total || 0) > 0) {
            <div class="total-row gift-card">
              <span>Gift card:</span>
              <span>-{{ formatPrice(cart()?.gift_card_total || 0) }}</span>
            </div>
          }
          
          <div class="total-divider"></div>
          
          <div class="total-row final-total">
            <span>Total:</span>
            <span>{{ formatPrice(cart()?.total || 0) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  cart = signal<HttpTypes.StoreCart | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  shippingOptions = signal<any[]>([]);
  paymentOptions = signal<any[]>([]);
  selectedShippingOption = '';
  selectedPaymentOption = '';
  sameAsBilling = true;
  _forceStep = signal<string | null>(null);
  discountCode = '';
  discountError = signal<string | null>(null);

  emailForm = {
    email: ''
  };

  addressForm = {
    shipping_address: {
      first_name: '',
      last_name: '',
      address_1: '',
      city: '',
      postal_code: '',
      country_code: '',
      phone: ''
    },
    billing_address: {
      first_name: '',
      last_name: '',
      address_1: '',
      city: '',
      postal_code: '',
      country_code: ''
    }
  };

  currentStep = computed(() => {
    const forcedStep = this._forceStep();
    if (forcedStep) {
      return forcedStep;
    }

    const cart = this.cart();
    if (!cart) return 'email';

    if (!cart.email) return 'email';
    if (!cart.shipping_address?.address_1) return 'delivery';
    if (!cart.shipping_methods?.length) return 'shipping';
    if (!cart.payment_collection) return 'payment';
    return 'review';
  });

  ngOnInit() {
    // Subscribe to cart changes like cart drawer does
    this.cartService.cart$.subscribe(cart => {
      console.log('Checkout received cart data:', cart);
      if (cart) {
        this.cart.set(cart);
        this.loadCartData(cart);
      }
    });
    
    // Initial load
    this.loadCart();
  }

  async loadCart() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const cart = await this.cartService.retrieveCart();
      if (cart) {
        this.cart.set(cart);
        this.loadCartData(cart);
      } else {
        this.errorMessage.set('No cart found. Please add items to your cart first.');
      }
    } catch (error) {
      console.error('Failed to load cart', error);
      this.errorMessage.set('Failed to load cart. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  loadCartData(cart: any) {
    // Pre-fill forms with existing data
    if (cart.email) {
      this.emailForm.email = cart.email;
    }

    if (cart.shipping_address) {
      this.addressForm.shipping_address = {
        first_name: cart.shipping_address.first_name || '',
        last_name: cart.shipping_address.last_name || '',
        address_1: cart.shipping_address.address_1 || '',
        city: cart.shipping_address.city || '',
        postal_code: cart.shipping_address.postal_code || '',
        country_code: cart.shipping_address.country_code || '',
        phone: cart.shipping_address.phone || ''
      };
    }

    if (cart.billing_address) {
       this.addressForm.billing_address = {
        first_name: cart.billing_address.first_name || '',
        last_name: cart.billing_address.last_name || '',
        address_1: cart.billing_address.address_1 || '',
        city: cart.billing_address.city || '',
        postal_code: cart.billing_address.postal_code || '',
        country_code: cart.billing_address.country_code || ''
      };
      this.sameAsBilling = false;
    }

    if (cart.shipping_address) {
      this.loadShippingOptions();
    }

    if(cart.shipping_methods?.length) {
      this.loadPaymentOptions();
    }
  }

  async loadShippingOptions() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const cartId = this.cart()?.id;
      if (cartId) {
        console.log('Loading shipping options for cart:', cartId);
        console.log('Cart shipping address:', this.cart()?.shipping_address);
        
        const options = await this.cartService.getShippingOptions(cartId);
        console.log('Shipping options loaded:', options);
        console.log('Shipping options count:', options.length);
        
        this.shippingOptions.set(options);
        if (this.cart()?.shipping_methods?.length) {
          this.selectedShippingOption = this.cart()?.shipping_methods?.[0]?.shipping_option_id || '';
        }
      } else {
        console.log('No cart ID available for shipping options');
      }
    } catch (error) {
      console.error('Failed to load shipping options', error);
      this.errorMessage.set('Failed to load shipping options. Please try again.');
      this.shippingOptions.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPaymentOptions() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const cart = await this.cartService.createPaymentSessions();
      if (cart) {
        this.cart.set(cart);
        // Access payment_sessions through payment_collection safely
        const paymentSessions = (cart as any)?.payment_collection?.payment_sessions || [];
        this.paymentOptions.set(paymentSessions);
      }
    } catch (error) {
      console.error('Failed to load payment options', error);
      this.errorMessage.set('Failed to load payment options. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitEmail() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const cartId = this.cart()?.id;
      if (cartId) {
        const cart = await this.cartService.updateCart(cartId, { email: this.emailForm.email });
        this.cart.set(cart);
      }
    } catch (error) {
      console.error('Failed to update email', error);
      this.errorMessage.set('Failed to update email. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitAddresses() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const cartId = this.cart()?.id;
    console.log('Submitting addresses for cart:', cartId);
    console.log('Address data:', this.addressForm);
    
    if (cartId) {
      try {
        const cart = await this.cartService.updateCart(cartId, { 
          shipping_address: this.addressForm.shipping_address,
          billing_address: this.sameAsBilling ? this.addressForm.shipping_address : this.addressForm.billing_address
        });
        
        console.log('Addresses updated successfully, new cart:', cart);
        this.cart.set(cart);
        await this.loadShippingOptions();
        this.isLoading.set(false);
      } catch (err: any) {
        console.error('Failed to update addresses', err);
        
        // Check if it's an unknown error which might indicate cart corruption
        const errorMessage = err?.message || '';
        if (errorMessage.includes('unknown error') || errorMessage.includes('An unknown error occurred')) {
          this.errorMessage.set('Cart update failed. Please refresh the page and try again.');
        } else {
          this.errorMessage.set('Failed to update addresses. Please try again.');
        }
        
        this.isLoading.set(false);
      }
    } else {
      console.error('No cart ID available');
      this.isLoading.set(false);
    }
  }

  async submitShippingMethod() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const cartId = this.cart()?.id;
    console.log('Submitting shipping method for cart:', cartId);
    console.log('Selected shipping option:', this.selectedShippingOption);
    
    if (cartId) {
      try {
        const cart = await this.cartService.addShippingMethod(cartId, this.selectedShippingOption);
        console.log('Shipping method added successfully:', cart);
        this.cart.set(cart);
        await this.loadPaymentOptions();
        this.isLoading.set(false);
      } catch (err) {
        console.error('Failed to add shipping method', err);
        this.errorMessage.set('Failed to add shipping method. Please try again.');
        this.isLoading.set(false);
      }
    } else {
      console.error('No cart ID available for shipping method');
      this.isLoading.set(false);
    }
  }

  async submitPayment() {
    console.log("Submit payment clicked, but nothing happens yet.");
    // This is where we would normally proceed to review or place order
  }

  async placeOrder() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const order = await this.cartService.placeOrder();
      if (order) {
        alert('Order placed successfully!');
        this.router.navigate(['/']);
      } else {
        this.errorMessage.set('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Failed to place order', error);
      this.errorMessage.set('Failed to place order. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToStep(step: string) {
    this._forceStep.set(step);
  }
  
  onSameAsBillingChange() {
    if (this.sameAsBilling) {
      this.addressForm.billing_address = {
        first_name: '',
        last_name: '',
        address_1: '',
        city: '',
        postal_code: '',
        country_code: ''
      };
    }
  }

  isAddressFormValid(): boolean {
    const requiredFields = ['first_name', 'last_name', 'address_1', 'city', 'postal_code', 'country_code'];
    
    const isShippingValid = requiredFields.every(field => (this.addressForm.shipping_address as any)[field]);
    if (!isShippingValid) return false;

    if (!this.sameAsBilling) {
      const isBillingValid = requiredFields.every(field => (this.addressForm.billing_address as any)[field]);
      if (!isBillingValid) return false;
    }

    return true;
  }

  getSelectedShippingMethodName(): string {
    const selectedMethod = this.shippingOptions().find(
      (option) => option.id === this.cart()?.shipping_methods?.[0]?.shipping_option_id
    );
    return selectedMethod ? selectedMethod.name : 'N/A';
  }

  formatPrice(amount: number): string {
    const cart = this.cart();
    if (!cart) return '';
    const currencyCode = cart.region?.currency_code || 'eur';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }



  async updateQuantity(lineId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    
    this.isLoading.set(true);
    try {
      await this.cartService.updateLineItem(lineId, newQuantity);
      await this.loadCart();
    } catch (error) {
      console.error('Failed to update quantity', error);
      this.errorMessage.set('Failed to update quantity. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async removeItem(lineId: string) {
    this.isLoading.set(true);
    try {
      await this.cartService.removeLineItem(lineId);
      await this.loadCart();
    } catch (error) {
      console.error('Failed to remove item', error);
      this.errorMessage.set('Failed to remove item. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async applyDiscount() {
    if (!this.discountCode.trim()) return;
    
    this.isLoading.set(true);
    this.discountError.set(null);
    try {
      await this.cartService.applyDiscount(this.discountCode.trim());
      await this.loadCart();
      this.discountCode = '';
    } catch (error) {
      console.error('Failed to apply discount', error);
      this.discountError.set('Invalid discount code. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper method to manually clear cart for debugging
  forceClearCart(): void {
    console.log('Force clearing cart...');
    this.cartService.forceClearCart();
    window.location.reload();
  }
}
