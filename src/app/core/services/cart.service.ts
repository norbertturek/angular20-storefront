import { Injectable, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { ErrorHandlerService } from './error-handler.service';
import { MedusaService } from '@api/medusa.service';
import { RegionsService } from '@api/regions.service';
import { ToastService } from './toast.service';

export interface AddToCartItem {
  variant_id: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private medusaService = inject(MedusaService);
  private regionsService = inject(RegionsService);
  private errorHandler = inject(ErrorHandlerService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  public cart = signal<HttpTypes.StoreCart | null>(null);
  private cartId = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const storedCartId = localStorage.getItem('cart_id');
      if (storedCartId) {
        this.cartId.set(storedCartId);
        this.retrieveCart();
      }
    }
  }

  private saveCartToStorage(cartIdValue: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cart_id', cartIdValue);
    }
    this.cartId.set(cartIdValue);
  }

  async createCart(regionId?: string): Promise<HttpTypes.StoreCart> {
    try {
      if (!regionId) {
        const regions = await this.regionsService.listRegions();
        if (regions.length > 0) {
          regionId = regions[0].id;
        }
      }
      if (!regionId) {
        throw new Error('No region available for cart creation');
      }
      const response = await this.medusaService.store.cart.create({ region_id: regionId });
      this.saveCartToStorage(response.cart.id);
      this.cart.set(response.cart);
      return response.cart;
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'createCart' });
      throw error;
    }
  }

  async retrieveCart(): Promise<HttpTypes.StoreCart | null> {
    const currentCartId = this.cartId();
    if (!currentCartId) return null;
    try {
      const response = await this.medusaService.store.cart.retrieve(currentCartId);
      this.cart.set(response.cart);
      return response.cart;
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'retrieveCart' });
      if (error instanceof Error && (error.message.includes('was not found') || error.message.includes('not found'))) {
        // Cart has invalid reference, clearing cart
      }
      this.clearCart();
      return null;
    }
  }

  async addToCart(item: AddToCartItem): Promise<void> {
    let cart = this.cart();
    if (!cart) {
      cart = await this.createCart();
    }
    try {
      await this.medusaService.store.cart.createLineItem(cart.id, { variant_id: item.variant_id, quantity: item.quantity });
      await this.retrieveCart();
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'addToCart' });
      throw error;
    }
  }

  async addToCartLegacy(variantId: string, quantity: number): Promise<void> {
    return this.addToCart({ variant_id: variantId, quantity });
  }

  async updateLineItem(lineId: string, quantity: number): Promise<void> {
    const currentCartId = this.cartId();
    if (!currentCartId) return;
    try {
      await this.medusaService.store.cart.updateLineItem(currentCartId, lineId, { quantity });
      await this.retrieveCart();
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'updateLineItem' });
      throw error;
    }
  }

  async removeLineItem(lineId: string): Promise<void> {
    const currentCartId = this.cartId();
    if (!currentCartId) return;
    try {
      await this.medusaService.store.cart.deleteLineItem(currentCartId, lineId);
      await this.retrieveCart();
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'removeLineItem' });
      throw error;
    }
  }

  getCartQuantity(): number {
    const cart = this.cart();
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    const cart = this.cart();
    if (!cart) return 0;
    return cart.total || 0;
  }

  getCartItems(): HttpTypes.StoreCartLineItem[] {
    const cart = this.cart();
    return cart?.items || [];
  }

  async getShippingOptions(cartIdValue: string): Promise<any[]> {
    if (!cartIdValue) return [];
    try {
      const data = await this.medusaService.fetch<{ shipping_options: any[] }>(`/store/shipping-options?cart_id=${cartIdValue}`);
      return data.shipping_options || [];
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'getShippingOptions' });
      return [];
    }
  }

  async applyDiscount(code: string): Promise<void> {
    const currentCartId = this.cartId();
    if (!currentCartId) return;
    try {
      await this.medusaService.store.cart.update(currentCartId, { promo_codes: [code] });
      await this.retrieveCart();
      this.toastService.success('Discount applied successfully');
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'applyDiscount' });
      this.toastService.error('Failed to apply discount. Please check the code and try again.');
      throw error;
    }
  }

  async removeDiscount(code: string): Promise<void> {
    const currentCartId = this.cartId();
    if (!currentCartId) return;
    try {
      const cart = this.cart();
      if (!cart) return;
      const currentPromoCodes = (cart as any).promo_codes || [];
      const updatedPromoCodes = currentPromoCodes.filter((promo: any) => promo.code !== code);
      await this.medusaService.store.cart.update(currentCartId, { promo_codes: updatedPromoCodes });
      await this.retrieveCart();
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'removeDiscount' });
      throw error;
    }
  }

  async initiatePaymentSession(providerId: string): Promise<void> {
    const currentCartId = this.cartId();
    if (!currentCartId) return;
    try {
      await this.medusaService.fetch(`/store/carts/${currentCartId}/payment-sessions`, { method: 'POST', body: { provider_id: providerId } });
      await this.retrieveCart();
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'initiatePaymentSession' });
      throw error;
    }
  }

  async setPaymentMethod(sessionId: string, data: any): Promise<void> {
    try {
      await this.medusaService.fetch(`/store/carts/payment-sessions/${sessionId}`, { method: 'POST', body: data });
      await this.retrieveCart();
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'setPaymentMethod' });
      throw error;
    }
  }

  async getPaymentMethods(): Promise<any[]> {
    const cart = this.cart();
    if (!cart) return [];
    return ((cart as any).payment_sessions || []).map((session: any) => session.provider_id);
  }

  async createPaymentSessions(): Promise<HttpTypes.StoreCart | null> {
    const currentCartId = this.cartId();
    if (!currentCartId) return null;
    try {
      const response = await this.medusaService.fetch<{ cart: HttpTypes.StoreCart }>(`/store/carts/${currentCartId}/payment-sessions`, { method: 'POST' });
      this.cart.set(response.cart);
      return response.cart;
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'createPaymentSessions' });
      throw error;
    }
  }

  async placeOrder(): Promise<any> {
    const currentCartId = this.cartId();
    if (!currentCartId) return null;
    try {
      const response = await this.medusaService.store.cart.complete(currentCartId);
      this.clearCart();
      return response;
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'placeOrder' });
      throw error;
    }
  }

  async updateCart(cartIdValue: string, data: any): Promise<HttpTypes.StoreCart | null> {
    try {
      const response = await this.medusaService.store.cart.update(cartIdValue, data);
      this.cart.set(response.cart);
      return response.cart;
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'updateCart' });
      throw error;
    }
  }

  async addShippingMethod(cartIdValue: string, shippingOptionId: string): Promise<HttpTypes.StoreCart | null> {
    try {
      const response = await this.medusaService.store.cart.addShippingMethod(cartIdValue, { option_id: shippingOptionId });
      this.cart.set(response.cart);
      return response.cart;
    } catch (error) {
      this.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), { component: 'CartService', action: 'addShippingMethod' });
      throw error;
    }
  }

  clearCart(): void {
    this.cart.set(null);
    this.cartId.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('cart_id');
    }
  }

  forceClearCart(): void {
    this.clearCart();
  }

  async handleCorruptedCart(): Promise<HttpTypes.StoreCart | null> {
    this.clearCart();
    return this.createCart();
  }
} 