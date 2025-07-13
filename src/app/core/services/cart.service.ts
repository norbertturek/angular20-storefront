import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID, signal } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { injectErrorHandlerService } from '@services/error-handler.service';
import { injectMedusaService } from '@api/medusa.service';
import { injectRegionsService } from '@api/regions.service';
import { injectToastService } from '@services/toast.service';

export interface AddToCartItem {
  variant_id: string;
  quantity: number;
}

export interface CartService {
  cart: ReturnType<typeof signal<HttpTypes.StoreCart | null>>;
  getCartQuantity: () => number;
  getCartTotal: () => number;
  getCartItems: () => HttpTypes.StoreCartLineItem[];
  createCart: (regionId?: string) => Promise<HttpTypes.StoreCart>;
  retrieveCart: () => Promise<HttpTypes.StoreCart | null>;
  addToCart: (item: AddToCartItem) => Promise<void>;
  addToCartLegacy: (variantId: string, quantity: number) => Promise<void>;
  updateLineItem: (lineId: string, quantity: number) => Promise<void>;
  removeLineItem: (lineId: string) => Promise<void>;
  getShippingOptions: (cartId: string) => Promise<any[]>;
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: (code: string) => Promise<void>;
  initiatePaymentSession: (providerId: string) => Promise<void>;
  setPaymentMethod: (sessionId: string, data: any) => Promise<void>;
  getPaymentMethods: () => Promise<any[]>;
  createPaymentSessions: () => Promise<HttpTypes.StoreCart | null>;
  placeOrder: () => Promise<any>;
  updateCart: (cartId: string, data: any) => Promise<HttpTypes.StoreCart | null>;
  addShippingMethod: (cartId: string, shippingOptionId: string) => Promise<HttpTypes.StoreCart | null>;
  clearCart: () => void;
  forceClearCart: () => void;
  handleCorruptedCart: () => Promise<HttpTypes.StoreCart | null>;
}

export function createCartService(): CartService {
  const medusaService = injectMedusaService();
  const regionsService = injectRegionsService();
  const errorHandler = injectErrorHandlerService();
  const toastService = injectToastService();
  const platformId = inject(PLATFORM_ID);

  const cartSignal = signal<HttpTypes.StoreCart | null>(null);
  const cartId = signal<string | null>(null);

  // Initialize cart from storage
  if (isPlatformBrowser(platformId)) {
    const storedCartId = localStorage.getItem('cart_id');
    if (storedCartId) {
      cartId.set(storedCartId);
      retrieveCart();
    }
  }

  function saveCartToStorage(cartIdValue: string) {
    if (isPlatformBrowser(platformId)) {
      localStorage.setItem('cart_id', cartIdValue);
    }
    cartId.set(cartIdValue);
  }

  async function createCart(regionId?: string): Promise<HttpTypes.StoreCart> {
    try {
      // Get default region if none provided
      if (!regionId) {
        const regions = await regionsService.listRegions();
        if (regions.length > 0) {
          regionId = regions[0].id; // Use first available region
        }
      }

      if (!regionId) {
        throw new Error('No region available for cart creation');
      }

      const response = await medusaService.store.cart.create({
        region_id: regionId
      });
      saveCartToStorage(response.cart.id);
      cartSignal.set(response.cart);
      return response.cart;
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'createCart'
      });
      throw error;
    }
  }

  async function retrieveCart(): Promise<HttpTypes.StoreCart | null> {
    const currentCartId = cartId();
    if (!currentCartId) return null;

    try {
      const response = await medusaService.store.cart.retrieve(currentCartId);
      cartSignal.set(response.cart);
      return response.cart;
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'retrieveCart'
      });
      
      // If cart has invalid customer reference or doesn't exist, clear it
      if (error instanceof Error && (error.message.includes('was not found') || error.message.includes('not found'))) {
        // Cart has invalid reference, clearing cart
      }
      
      clearCart();
      return null;
    }
  }

  async function addToCart(item: AddToCartItem): Promise<void> {
    let cart = cartSignal();
    
    if (!cart) {
      // Create a new cart if none exists
      cart = await createCart();
    }

    try {
      await medusaService.store.cart.createLineItem(cart.id, {
        variant_id: item.variant_id,
        quantity: item.quantity
      });
      
      await retrieveCart();
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'addToCart'
      });
      throw error;
    }
  }

  async function addToCartLegacy(variantId: string, quantity: number): Promise<void> {
    return addToCart({ variant_id: variantId, quantity });
  }

  async function updateLineItem(lineId: string, quantity: number): Promise<void> {
    const currentCartId = cartId();
    if (!currentCartId) return;

    try {
      await medusaService.store.cart.updateLineItem(currentCartId, lineId, {
        quantity
      });
      
      await retrieveCart();
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'updateLineItem'
      });
      throw error;
    }
  }

  async function removeLineItem(lineId: string): Promise<void> {
    const currentCartId = cartId();
    if (!currentCartId) return;

    try {
      await medusaService.store.cart.deleteLineItem(currentCartId, lineId);
      await retrieveCart();
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'removeLineItem'
      });
      throw error;
    }
  }

  function getCartQuantity(): number {
    const cart = cartSignal();
    if (!cart?.items) return 0;
    
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  function getCartTotal(): number {
    const cart = cartSignal();
    if (!cart) return 0;
    
    return cart.total || 0;
  }

  function getCartItems(): HttpTypes.StoreCartLineItem[] {
    const cart = cartSignal();
    return cart?.items || [];
  }

  async function getShippingOptions(cartIdValue: string): Promise<any[]> {
    if (!cartIdValue) return [];

    try {
      const data = await medusaService.fetch<{ shipping_options: any[] }>(`/store/shipping-options?cart_id=${cartIdValue}`);
      return data.shipping_options || [];
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'getShippingOptions'
      });
      return [];
    }
  }

  async function applyDiscount(code: string): Promise<void> {
    const currentCartId = cartId();
    if (!currentCartId) return;

    try {
      await medusaService.store.cart.update(currentCartId, {
        promo_codes: [code]
      });
      
      await retrieveCart();
      toastService.success('Discount applied successfully');
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'applyDiscount'
      });
      toastService.error('Failed to apply discount. Please check the code and try again.');
      throw error;
    }
  }

  async function removeDiscount(code: string): Promise<void> {
    const currentCartId = cartId();
    if (!currentCartId) return;

    try {
      const cart = cartSignal();
      if (!cart) return;

      // Handle promo codes properly
      const currentPromoCodes = (cart as any).promo_codes || [];
      const updatedPromoCodes = currentPromoCodes.filter((promo: any) => promo.code !== code);

      await medusaService.store.cart.update(currentCartId, {
        promo_codes: updatedPromoCodes
      });
      
      await retrieveCart();
      toastService.success('Discount removed successfully');
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'removeDiscount'
      });
      toastService.error('Failed to remove discount. Please try again.');
      throw error;
    }
  }

  async function initiatePaymentSession(providerId: string): Promise<void> {
    const currentCartId = cartId();
    if (!currentCartId) return;

    try {
      // Use the correct method for creating payment sessions
      await medusaService.fetch(`/store/carts/${currentCartId}/payment-sessions`, {
        method: 'POST'
      });
      await retrieveCart();
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'initiatePaymentSession'
      });
      throw error;
    }
  }

  async function setPaymentMethod(sessionId: string, data: any): Promise<void> {
    try {
      await medusaService.fetch(`/store/carts/payment-sessions/${sessionId}`, {
        method: 'POST',
        body: data
      });
      await retrieveCart();
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'setPaymentMethod'
      });
      throw error;
    }
  }

  async function getPaymentMethods(): Promise<any[]> {
    try {
      const data = await medusaService.fetch<{ payment_providers: any[] }>('/store/payment-providers');
      return data.payment_providers || [];
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'getPaymentMethods'
      });
      return [];
    }
  }

  async function createPaymentSessions(): Promise<HttpTypes.StoreCart | null> {
    const currentCartId = cartId();
    if (!currentCartId) return null;

    try {
      await medusaService.fetch(`/store/carts/${currentCartId}/payment-sessions`, {
        method: 'POST'
      });
      await retrieveCart();
      return cartSignal();
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'createPaymentSessions'
      });
      throw error;
    }
  }

  async function placeOrder(): Promise<any> {
    const currentCartId = cartId();
    if (!currentCartId) return null;

    try {
      const response = await medusaService.store.cart.complete(currentCartId);
      clearCart();
      return response;
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'placeOrder'
      });
      throw error;
    }
  }

  async function updateCart(cartIdValue: string, data: any): Promise<HttpTypes.StoreCart | null> {
    try {
      const response = await medusaService.store.cart.update(cartIdValue, data);
      cartSignal.set(response.cart);
      return response.cart;
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'updateCart'
      });
      throw error;
    }
  }

  async function addShippingMethod(cartIdValue: string, shippingOptionId: string): Promise<HttpTypes.StoreCart | null> {
    try {
      const response = await medusaService.store.cart.addShippingMethod(cartIdValue, {
        option_id: shippingOptionId
      });
      cartSignal.set(response.cart);
      return response.cart;
    } catch (error) {
      errorHandler.handleError(error as Error, {
        component: 'CartService',
        action: 'addShippingMethod'
      });
      throw error;
    }
  }

  function clearCart(): void {
    cartSignal.set(null);
    cartId.set(null);
    if (isPlatformBrowser(platformId)) {
      localStorage.removeItem('cart_id');
    }
  }

  function forceClearCart(): void {
    clearCart();
  }

  async function handleCorruptedCart(): Promise<HttpTypes.StoreCart | null> {
    clearCart();
    return createCart();
  }

  return {
    cart: cartSignal,
    getCartQuantity,
    getCartTotal,
    getCartItems,
    createCart,
    retrieveCart,
    addToCart,
    addToCartLegacy,
    updateLineItem,
    removeLineItem,
    getShippingOptions,
    applyDiscount,
    removeDiscount,
    initiatePaymentSession,
    setPaymentMethod,
    getPaymentMethods,
    createPaymentSessions,
    placeOrder,
    updateCart,
    addShippingMethod,
    clearCart,
    forceClearCart,
    handleCorruptedCart
  };
}

export function injectCartService(): CartService {
  return inject(CART_SERVICE);
}

export const CART_SERVICE = new InjectionToken<CartService>('CartService'); 