import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { HttpTypes } from '@medusajs/types';

import { CartService } from '@services/cart.service';
import { ToastService } from '@services/toast.service';

import { DiscountCodeComponent } from '@sharedComponents/discount-code/discount-code.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DiscountCodeComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  router = inject(Router);

  cart = signal<HttpTypes.StoreCart | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  shippingOptions = signal<any[]>([]);
  paymentOptions = signal<any[]>([]);
  selectedShippingOption = signal<string>('');
  selectedPaymentOption = signal<string>('');
  sameAsBilling = signal<boolean>(true);
  _forceStep = signal<string | null>(null);
  discountCode = signal<string>('');
  discountError = signal<string | null>(null);

  // Signal-based form state
  email = signal('');

  // Shipping address signals
  shippingFirstName = signal('');
  shippingLastName = signal('');
  shippingAddress1 = signal('');
  shippingCity = signal('');
  shippingPostalCode = signal('');
  shippingCountryCode = signal('');
  shippingPhone = signal('');

  // Billing address signals
  billingFirstName = signal('');
  billingLastName = signal('');
  billingAddress1 = signal('');
  billingCity = signal('');
  billingPostalCode = signal('');
  billingCountryCode = signal('');

  // Computed form validation
  isEmailValid = computed(() => {
    const emailValue = this.email();
    return emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  });

  isShippingAddressValid = computed(() => {
    return this.shippingFirstName() && 
           this.shippingLastName() && 
           this.shippingAddress1() && 
           this.shippingCity() && 
           this.shippingPostalCode() && 
           this.shippingCountryCode();
  });

  isBillingAddressValid = computed(() => {
    if (this.sameAsBilling()) {
      return this.isShippingAddressValid();
    }
    return this.billingFirstName() && 
           this.billingLastName() && 
           this.billingAddress1() && 
           this.billingCity() && 
           this.billingPostalCode() && 
           this.billingCountryCode();
  });

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

  // --- PERFORMANCE OPTIMIZATION ---
  // Move effect out of constructor to class field
  cartEffect = (() => {
    // Use effect to reactively update cart when cart service changes
    const cart = this.cartService.cart();
    if (cart) {
      this.cart.set(cart);
      this.loadCartData(cart);
    }
  })();

  // Computed for selected shipping method name
  selectedShippingMethodName = computed(() => {
    const cart = this.cart();
    if (!cart?.shipping_methods?.length) return '';
    
    const method = cart.shipping_methods[0];
    const option = this.shippingOptions().find(opt => opt.id === method.shipping_option_id);
    return option?.name || 'Standard Shipping';
  });

  // Computed for selected shipping method price
  selectedShippingMethodPrice = computed(() => {
    const cart = this.cart();
    if (!cart?.shipping_methods?.length) return 0;
    
    const method = cart.shipping_methods[0];
    return method.amount || 0;
  });

  constructor() {
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
      this.errorMessage.set('Failed to load cart. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  loadCartData(cart: any) {
    // Pre-fill forms with existing data
    if (cart.email) {
      this.email.set(cart.email);
    }

    if (cart.shipping_address) {
      this.shippingFirstName.set(cart.shipping_address.first_name || '');
      this.shippingLastName.set(cart.shipping_address.last_name || '');
      this.shippingAddress1.set(cart.shipping_address.address_1 || '');
      this.shippingCity.set(cart.shipping_address.city || '');
      this.shippingPostalCode.set(cart.shipping_address.postal_code || '');
      this.shippingCountryCode.set(cart.shipping_address.country_code || '');
      this.shippingPhone.set(cart.shipping_address.phone || '');
    }

    if (cart.billing_address) {
      this.billingFirstName.set(cart.billing_address.first_name || '');
      this.billingLastName.set(cart.billing_address.last_name || '');
      this.billingAddress1.set(cart.billing_address.address_1 || '');
      this.billingCity.set(cart.billing_address.city || '');
      this.billingPostalCode.set(cart.billing_address.postal_code || '');
      this.billingCountryCode.set(cart.billing_address.country_code || '');
      this.sameAsBilling.set(false);
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
        const options = await this.cartService.getShippingOptions(cartId);
        
        this.shippingOptions.set(options);
        if (this.cart()?.shipping_methods?.length) {
          this.selectedShippingOption.set(this.cart()?.shipping_methods?.[0]?.shipping_option_id || '');
        }
      }
    } catch (error) {
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
        const cart = await this.cartService.updateCart(cartId, { email: this.email() });
        this.cart.set(cart);
      }
    } catch (error) {
      this.errorMessage.set('Failed to update email. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitAddresses() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const cartId = this.cart()?.id;
      if (cartId) {
        const shippingAddress = {
          first_name: this.shippingFirstName(),
          last_name: this.shippingLastName(),
          address_1: this.shippingAddress1(),
          city: this.shippingCity(),
          postal_code: this.shippingPostalCode(),
          country_code: this.shippingCountryCode(),
          phone: this.shippingPhone()
        };

        const billingAddress = this.sameAsBilling() ? shippingAddress : {
          first_name: this.billingFirstName(),
          last_name: this.billingLastName(),
          address_1: this.billingAddress1(),
          city: this.billingCity(),
          postal_code: this.billingPostalCode(),
          country_code: this.billingCountryCode()
        };

        const cart = await this.cartService.updateCart(cartId, {
          shipping_address: shippingAddress,
          billing_address: billingAddress
        });
        this.cart.set(cart);
        this.loadShippingOptions();
      }
    } catch (error) {
      this.errorMessage.set('Failed to update addresses. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitShippingMethod() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const cartId = this.cart()?.id;
    
    if (cartId) {
      try {
        const cart = await this.cartService.addShippingMethod(cartId, this.selectedShippingOption());
        this.cart.set(cart);
        await this.loadPaymentOptions();
        this.isLoading.set(false);
      } catch (err) {
        this.errorMessage.set('Failed to add shipping method. Please try again.');
        this.isLoading.set(false);
      }
    } else {
      this.isLoading.set(false);
    }
  }

  async submitPayment() {
    // This is where we would normally proceed to review or place order
  }

  async placeOrder() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const order = await this.cartService.placeOrder();
      if (order) {
        // Toast will be shown by CartService
        this.router.navigate(['/']);
      } else {
        this.errorMessage.set('Failed to place order. Please try again.');
      }
    } catch (error) {
      this.errorMessage.set('Failed to place order. Please try again.');
      // Toast will be shown by CartService
    } finally {
      this.isLoading.set(false);
    }
  }

  goToStep(step: string) {
    this._forceStep.set(step);
  }

  onCheckboxChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.sameAsBilling.set(target.checked);
    this.onSameAsBillingChange();
  }
  
  onSameAsBillingChange() {
    if (this.sameAsBilling()) {
      this.billingFirstName.set('');
      this.billingLastName.set('');
      this.billingAddress1.set('');
      this.billingCity.set('');
      this.billingPostalCode.set('');
      this.billingCountryCode.set('');
    }
  }

  isAddressFormValid = computed(() => {
    return this.isShippingAddressValid() && this.isBillingAddressValid();
  });

  getSelectedShippingMethodName(): string {
    return this.selectedShippingMethodName();
  }

  async updateQuantity(lineId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    
    this.isLoading.set(true);
    try {
      await this.cartService.updateLineItem(lineId, newQuantity);
      await this.loadCart();
      // Toast will be shown by CartService
    } catch (error) {
      this.errorMessage.set('Failed to update quantity. Please try again.');
      // Toast will be shown by CartService
    } finally {
      this.isLoading.set(false);
    }
  }

  async removeItem(lineId: string) {
    this.isLoading.set(true);
    try {
      await this.cartService.removeLineItem(lineId);
      await this.loadCart();
      // Toast will be shown by CartService
    } catch (error) {
      this.errorMessage.set('Failed to remove item. Please try again.');
      // Toast will be shown by CartService
    } finally {
      this.isLoading.set(false);
    }
  }

  async applyDiscount() {
    if (!this.discountCode().trim()) return;
    
    this.isLoading.set(true);
    this.discountError.set(null);
    try {
      await this.cartService.applyDiscount(this.discountCode().trim());
      await this.loadCart();
      this.discountCode.set('');
      // Toast will be shown by CartService
    } catch (error) {
      this.discountError.set('Invalid discount code. Please try again.');
      // Toast will be shown by CartService
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper method to manually clear cart for debugging
  forceClearCart(): void {
    this.cartService.forceClearCart();
    window.location.reload();
  }
}

