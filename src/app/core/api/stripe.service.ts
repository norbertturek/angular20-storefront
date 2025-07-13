import { environment } from '@environments/environment';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { InjectionToken } from '@angular/core';
import { inject } from '@angular/core';

export interface StripeService {
  initializeStripe: (clientSecret: string) => Promise<void>;
  createCardElement: () => StripeCardElement;
  createPaymentMethod: (billingAddress: any) => Promise<any>;
  createToken: (billingAddress: any) => Promise<any>;
  confirmCardPayment: (clientSecret: string, paymentMethodId: string) => Promise<any>;
  isStripeProvider: (providerId?: string) => boolean;
  mountCardElement: (elementId: string) => void;
  unmountCardElement: () => void;
  destroy: () => void;
}

export function createStripeService(): StripeService {
  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let cardElement: StripeCardElement | null = null;
  const stripePromise = loadStripe(environment.stripePublishableKey);

  async function initializeStripe(clientSecret: string): Promise<void> {
    stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    elements = stripe.elements({
      clientSecret: clientSecret
    });
  }

  function createCardElement(): StripeCardElement {
    if (!elements) {
      throw new Error('Stripe elements not initialized');
    }

    cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: 'Inter, sans-serif',
          color: '#050505',
          '::placeholder': {
            color: '#808080',
          },
          fontSize: '16px',
        },
      },
    });

    return cardElement;
  }

  async function createPaymentMethod(billingAddress: any): Promise<any> {
    if (!stripe || !cardElement) {
      throw new Error('Stripe not properly initialized');
    }

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: `${billingAddress.first_name} ${billingAddress.last_name}`,
        address: {
          line1: billingAddress.address_1,
          line2: billingAddress.address_2,
          city: billingAddress.city,
          country: billingAddress.country_code,
          postal_code: billingAddress.postal_code,
          state: billingAddress.province,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentMethod;
  }

  async function createToken(billingAddress: any): Promise<any> {
    if (!stripe || !cardElement) {
      throw new Error('Stripe not properly initialized');
    }

    const { token, error } = await stripe.createToken(cardElement, {
      name: `${billingAddress.first_name} ${billingAddress.last_name}`,
      address_line1: billingAddress.address_1,
      address_line2: billingAddress.address_2,
      address_city: billingAddress.city,
      address_country: billingAddress.country_code,
      address_zip: billingAddress.postal_code,
      address_state: billingAddress.province,
    });

    if (error) {
      throw new Error(error.message);
    }

    return token;
  }

  async function confirmCardPayment(clientSecret: string, paymentMethodId: string): Promise<any> {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  }

  function isStripeProvider(providerId?: string): boolean {
    return providerId?.startsWith('pp_stripe_') || false;
  }

  function mountCardElement(elementId: string): void {
    if (!cardElement) {
      throw new Error('Card element not created');
    }

    const element = document.getElementById(elementId);
    if (element) {
      cardElement.mount(`#${elementId}`);
    }
  }

  function unmountCardElement(): void {
    if (cardElement) {
      cardElement.unmount();
    }
  }

  function destroy(): void {
    unmountCardElement();
    cardElement = null;
    elements = null;
  }

  return {
    initializeStripe,
    createCardElement,
    createPaymentMethod,
    createToken,
    confirmCardPayment,
    isStripeProvider,
    mountCardElement,
    unmountCardElement,
    destroy
  };
}

export function injectStripeService(): StripeService {
  return inject(STRIPE_SERVICE);
}

export const STRIPE_SERVICE = new InjectionToken<StripeService>('StripeService'); 