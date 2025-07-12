import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpTypes } from '@medusajs/types';
import { CartService } from '../../core/services/cart.service';
import { DiscountCodeComponent } from './components/discount-code/discount-code.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DiscountCodeComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {
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

  constructor() {
    // Use effect to reactively update cart when cart service changes
    effect(() => {
      const cart = this.cartService.cart();
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
