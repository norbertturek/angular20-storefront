import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';
import { RegionsService } from './regions.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AddToCartItem {
  variant_id: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<HttpTypes.StoreCart | null>(null);
  private cartId = signal<string | null>(null);

  cart$ = this.cartSubject.asObservable();

  constructor(
    private medusaService: MedusaService,
    private regionsService: RegionsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCartFromStorage();
    }
  }

  private loadCartFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const storedCartId = localStorage.getItem('cart_id');
      if (storedCartId) {
        this.cartId.set(storedCartId);
        this.retrieveCart();
      }
    }
  }

  private saveCartToStorage(cartId: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cart_id', cartId);
    }
    this.cartId.set(cartId);
  }

  async createCart(regionId?: string): Promise<HttpTypes.StoreCart> {
    try {
      // Get default region if none provided
      if (!regionId) {
        console.log('No region provided, fetching regions...');
        const regions = await this.regionsService.listRegions();
        console.log('Available regions:', regions);
        if (regions.length > 0) {
          regionId = regions[0].id; // Use first available region
          console.log('Using region:', regionId);
        }
      }

      if (!regionId) {
        throw new Error('No region available for cart creation');
      }

      console.log('Creating cart with region:', regionId);
      const response = await this.medusaService.store.cart.create({
        region_id: regionId
      });
      
      console.log('Cart created successfully:', response.cart.id);
      this.saveCartToStorage(response.cart.id);
      this.cartSubject.next(response.cart);
      return response.cart;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  }

  async retrieveCart(): Promise<HttpTypes.StoreCart | null> {
    const cartId = this.cartId();
    if (!cartId) return null;

    try {
      const response = await this.medusaService.store.cart.retrieve(cartId);
      this.cartSubject.next(response.cart);
      return response.cart;
    } catch (error) {
      console.error('Error retrieving cart:', error);
      
      // If cart has invalid customer reference or doesn't exist, clear it
      if (error instanceof Error && (error.message.includes('was not found') || error.message.includes('not found'))) {
        console.log('Cart has invalid reference, clearing cart...');
      }
      
      this.clearCart();
      return null;
    }
  }

  async addToCart(item: AddToCartItem): Promise<void> {
    console.log('Adding to cart:', item);
    let cart = this.cartSubject.value;
    
    if (!cart) {
      console.log('No cart exists, creating new cart...');
      // Create a new cart if none exists
      cart = await this.createCart();
      console.log('Created new cart:', cart.id);
    }

    try {
      console.log('Adding line item to cart:', cart.id, item);
      await this.medusaService.store.cart.createLineItem(cart.id, {
        variant_id: item.variant_id,
        quantity: item.quantity
      });
      
      console.log('Line item added successfully, retrieving cart...');
      await this.retrieveCart();
      console.log('Cart retrieved successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async addToCartLegacy(variantId: string, quantity: number): Promise<void> {
    return this.addToCart({ variant_id: variantId, quantity });
  }

  async updateLineItem(lineId: string, quantity: number): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) return;

    try {
      await this.medusaService.store.cart.updateLineItem(cartId, lineId, {
        quantity
      });
      
      await this.retrieveCart();
    } catch (error) {
      console.error('Error updating line item:', error);
      throw error;
    }
  }

  async removeLineItem(lineId: string): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) return;

    try {
      await this.medusaService.store.cart.deleteLineItem(cartId, lineId);
      await this.retrieveCart();
    } catch (error) {
      console.error('Error removing line item:', error);
      throw error;
    }
  }

  getCartQuantity(): number {
    const cart = this.cartSubject.value;
    if (!cart?.items) return 0;
    
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    const cart = this.cartSubject.value;
    if (!cart) return 0;
    
    return cart.total || 0;
  }

  getCartItems(): HttpTypes.StoreCartLineItem[] {
    const cart = this.cartSubject.value;
    return cart?.items || [];
  }

  async getShippingOptions(cartId: string): Promise<any[]> {
    if (!cartId) return [];

    try {
      console.log('Fetching shipping options for cart:', cartId);
      const data = await this.medusaService.fetch<{ shipping_options: any[] }>(`/store/shipping-options?cart_id=${cartId}`);
      console.log('Raw shipping options response:', data);
      return data.shipping_options || [];
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      return [];
    }
  }

  async applyDiscount(code: string): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) return;

    try {
      await this.medusaService.store.cart.update(cartId, {
        promo_codes: [code]
      });
      
      await this.retrieveCart();
    } catch (error) {
      console.error('Error applying discount:', error);
      throw error;
    }
  }

  async removeDiscount(code: string): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) return;

    try {
      const cart = this.cartSubject.value;
      if (!cart) return;

      // Remove the specific code from existing promo codes
      const currentCodes = cart.promotions?.map(p => p.code).filter((code): code is string => Boolean(code)) || [];
      const updatedCodes = currentCodes.filter(c => c !== code);

      await this.medusaService.store.cart.update(cartId, {
        promo_codes: updatedCodes
      });
      
      await this.retrieveCart();
    } catch (error) {
      console.error('Error removing discount:', error);
      throw error;
    }
  }

  async initiatePaymentSession(providerId: string): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) return;

    try {
      await this.medusaService.fetch(`/store/carts/${cartId}/payment-sessions`, {
        method: 'POST',
        body: {
          provider_id: providerId
        }
      });
      
      await this.retrieveCart();
    } catch (error) {
      console.error('Error initiating payment session:', error);
      throw error;
    }
  }

  async setPaymentMethod(sessionId: string, data: any): Promise<void> {
    const cartId = this.cartId();
    if (!cartId) return;

    try {
      await this.medusaService.fetch(`/store/carts/${cartId}/payment-sessions/${sessionId}`, {
        method: 'POST',
        body: {
          data: data
        }
      });
      
      await this.retrieveCart();
    } catch (error) {
      console.error('Error setting payment method:', error);
      throw error;
    }
  }

  async getPaymentMethods(): Promise<any[]> {
    const cart = this.cartSubject.value;
    if (!cart) return [];

    try {
      const data = await this.medusaService.fetch<{ payment_providers: any[] }>(`/store/payment-providers?cart_id=${cart.id}`);
      return data.payment_providers || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async createPaymentSessions(): Promise<HttpTypes.StoreCart | null> {
    const cartId = this.cartId();
    if (!cartId) return null;

    try {
      const { cart } = await this.medusaService.fetch<{ cart: HttpTypes.StoreCart }>(`/store/carts/${cartId}/payment-sessions`, {
        method: 'POST',
      });
      this.cartSubject.next(cart);
      return cart;
    } catch (error) {
      console.error('Error creating payment sessions:', error);
      return null;
    }
  }

  async placeOrder(): Promise<any> {
    const cartId = this.cartId();
    if (!cartId) return null;

    try {
      const response = await this.medusaService.store.cart.complete(cartId);
      console.log('Order placement response:', response);
      this.clearCart(); // Clear cart after successful order
      return response;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  async updateCart(cartId: string, data: any): Promise<HttpTypes.StoreCart | null> {
    if (!cartId) return null;

    try {
      console.log('Updating cart with data:', data);
      console.log('Cart ID:', cartId);
      const { cart } = await this.medusaService.store.cart.update(cartId, data, {}, {});
      console.log('Cart updated successfully:', cart);
      this.cartSubject.next(cart);
      return cart;
    } catch (error: any) {
      console.error('Error updating cart:', error);
      console.error('Error details:', error);
      
      // Just throw the error - don't try to create new cart
      // The UI should handle cart corruption by refreshing the page
      throw error;
    }
  }

  async addShippingMethod(cartId: string, shippingOptionId: string): Promise<HttpTypes.StoreCart | null> {
    if (!cartId || !shippingOptionId) return null;

    try {
      const { cart } = await this.medusaService.store.cart.addShippingMethod(cartId, {
        option_id: shippingOptionId
      }, {});
      this.cartSubject.next(cart);
      return cart;
    } catch (error) {
      console.error('Error adding shipping method:', error);
      throw error;
    }
  }

  clearCart(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('cart_id');
    }
    this.cartId.set(null);
    this.cartSubject.next(null);
  }

  // Helper method to manually clear cart for debugging
  forceClearCart(): void {
    console.log('Force clearing cart...');
    this.clearCart();
  }

  // Method to handle corrupted cart - clear it and create a new one
  async handleCorruptedCart(): Promise<HttpTypes.StoreCart | null> {
    console.log('Handling corrupted cart - clearing and creating new...');
    this.clearCart();
    try {
      const newCart = await this.createCart();
      console.log('New cart created after corruption:', newCart.id);
      return newCart;
    } catch (error) {
      console.error('Failed to create new cart after corruption:', error);
      return null;
    }
  }
} 