import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { HttpTypes } from '@medusajs/types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = loadStripe(environment.stripePublishableKey);
  }

  async initializeStripe(clientSecret: string): Promise<void> {
    this.stripe = await this.stripePromise;
    
    if (!this.stripe) {
      throw new Error('Stripe failed to initialize');
    }

    this.elements = this.stripe.elements({
      clientSecret: clientSecret
    });
  }

  createCardElement(): StripeCardElement {
    if (!this.elements) {
      throw new Error('Stripe elements not initialized');
    }

    this.cardElement = this.elements.create('card', {
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

    return this.cardElement;
  }

  async createPaymentMethod(billingAddress: any): Promise<any> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe not properly initialized');
    }

    const { paymentMethod, error } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement,
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

  async createToken(billingAddress: any): Promise<any> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe not properly initialized');
    }

    const { token, error } = await this.stripe.createToken(this.cardElement, {
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

  async confirmCardPayment(clientSecret: string, paymentMethodId: string): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { paymentIntent, error } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  }

  isStripeProvider(providerId?: string): boolean {
    return providerId?.startsWith('pp_stripe_') || false;
  }

  mountCardElement(elementId: string): void {
    if (!this.cardElement) {
      throw new Error('Card element not created');
    }

    const element = document.getElementById(elementId);
    if (element) {
      this.cardElement.mount(`#${elementId}`);
    }
  }

  unmountCardElement(): void {
    if (this.cardElement) {
      this.cardElement.unmount();
    }
  }

  destroy(): void {
    this.unmountCardElement();
    this.cardElement = null;
    this.elements = null;
  }
} 