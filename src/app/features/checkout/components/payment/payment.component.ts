import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CartService } from '@/app/core/services/cart.service';
import { StripeService } from '@api/stripe.service';

import { HttpTypes } from '@medusajs/types';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` 
    <div class="payment-container">
      <h2>Payment</h2>
      
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading payment options...</p>
        </div>
      }
      
      @if (error()) {
        <div class="error-message">
          <p>{{ error() }}</p>
        </div>
      }
      
      @if (cart() && !isLoading()) {
        <div class="payment-methods">
          <h3>Select Payment Method</h3>
          
          @for (method of paymentMethods(); track method.id) {
            <div class="payment-method-option">
              <input 
                type="radio" 
                [id]="method.id" 
                name="paymentMethod" 
                [value]="method.id"
                [ngModel]="selectedPaymentMethod()"
                (ngModelChange)="selectedPaymentMethod.set($event); onPaymentMethodChange()"
              />
              <label [for]="method.id">
                <span class="method-name">{{ getPaymentMethodName(method.id) }}</span>
              </label>
            </div>
          }
        </div>
        
        @if (isStripeSelected()) {
          <div class="stripe-payment">
            <h3>Card Details</h3>
            
            @if (hasExistingCard()) {
              <div class="existing-card">
                <p>Card ending in {{ getCardLast4() }}</p>
                <button 
                  type="button" 
                  class="change-card-btn"
                  (click)="changeCard()"
                  [disabled]="isProcessing()"
                >
                  Change Card
                </button>
              </div>
            } @else {
              <div class="card-element-container">
                <div id="card-element" class="card-element"></div>
              </div>
            }
            
            @if (cardError()) {
              <div class="card-error">
                {{ cardError() }}
              </div>
            }
          </div>
        }
        
        <div class="payment-actions">
          @if (isStripeSelected() && !hasExistingCard()) {
            <button 
              type="button" 
              class="submit-payment-btn"
              (click)="submitPayment()"
              [disabled]="!isCardComplete() || isProcessing()"
            >
              @if (isProcessing()) {
                <span>Processing...</span>
              } @else {
                <span>Enter Card Details</span>
              }
            </button>
          } @else if (isStripeSelected() && hasExistingCard()) {
            <button 
              type="button" 
              class="place-order-btn"
              (click)="placeOrder()"
              [disabled]="isProcessing()"
            >
              @if (isProcessing()) {
                <span>Placing Order...</span>
              } @else {
                <span>Place Order</span>
              }
            </button>
          } @else if (selectedPaymentMethod()) {
            <button 
              type="button" 
              class="continue-btn"
              (click)="continueToReview()"
              [disabled]="isProcessing()"
            >
              Continue to Review
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements AfterViewInit {
  private cartService = inject(CartService);
  private stripeService = inject(StripeService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  cart = signal<HttpTypes.StoreCart | null>(null);
  paymentMethods = signal<any[]>([]);
  selectedPaymentMethod = signal<string>('');
  isLoading = signal(true);
  isProcessing = signal(false);
  error = signal<string | null>(null);
  cardError = signal<string | null>(null);
  isCardComplete = signal(false);
  cardBrand = signal<string | null>(null);

  // Computed properties
  isStripeSelected = computed(() => 
    this.stripeService.isStripeProvider(this.selectedPaymentMethod())
  );

  hasExistingCard = computed(() => {
    const cart = this.cart();
    const session = cart?.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
    return session?.data?.['payment_method_id'];
  });

  constructor() {
    this.loadPaymentData();
  }

  ngAfterViewInit() {
    // Initialize Stripe card element after view is ready
    if (this.isStripeSelected()) {
      this.initializeStripeCard();
    }
  }

  async loadPaymentData() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Get cart
      const cart = await this.cartService.retrieveCart();
      if (!cart) {
        throw new Error('No cart found');
      }
      this.cart.set(cart);

      // Get payment methods
      const methods = await this.cartService.getPaymentMethods();
      this.paymentMethods.set(methods);

      // Set default payment method
      const activeSession = cart.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
      if (activeSession) {
        this.selectedPaymentMethod.set(activeSession.provider_id);
      } else if (methods.length > 0) {
        this.selectedPaymentMethod.set(methods[0].id);
      }

    } catch (error) {
      console.error('Error loading payment data:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to load payment data');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onPaymentMethodChange() {
    if (!this.selectedPaymentMethod()) return;

    try {
      this.isProcessing.set(true);
      await this.cartService.initiatePaymentSession(this.selectedPaymentMethod());
      
      // Reload cart to get updated payment session
      await this.cartService.retrieveCart();
      
      if (this.isStripeSelected()) {
        setTimeout(() => this.initializeStripeCard(), 100);
      }
    } catch (error) {
      console.error('Error changing payment method:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to change payment method');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async initializeStripeCard() {
    try {
      const cart = this.cart();
      const session = cart?.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
      
      if (!session?.data?.['client_secret']) {
        throw new Error('No Stripe client secret found');
      }

      await this.stripeService.initializeStripe(session.data['client_secret'] as string);
      const cardElement = this.stripeService.createCardElement();
      
      cardElement.on('change', (event) => {
        this.cardError.set(event.error?.message || null);
        this.isCardComplete.set(event.complete);
        this.cardBrand.set(event.brand || null);
      });

      this.stripeService.mountCardElement('card-element');
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to initialize payment');
    }
  }

  async submitPayment() {
    if (!this.isCardComplete()) return;

    try {
      this.isProcessing.set(true);
      this.error.set(null);

      const cart = this.cart();
      if (!cart?.billing_address) {
        throw new Error('Billing address is required');
      }

      const token = await this.stripeService.createToken(cart.billing_address);
      const session = cart.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
      
      if (!session) {
        throw new Error('No payment session found');
      }

      await this.cartService.setPaymentMethod(session.id, { token: token.id });
      
      // Navigate to review step
      this.router.navigate(['/checkout'], { queryParams: { step: 'review' } });
      
    } catch (error) {
      console.error('Error submitting payment:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async placeOrder() {
    try {
      this.isProcessing.set(true);
      this.error.set(null);

      const cart = this.cart();
      const session = cart?.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
      
      if (!session?.data?.['client_secret'] || !session?.data?.['payment_method_id']) {
        throw new Error('Payment method not properly configured');
      }

      // Confirm payment with Stripe
      const paymentIntent = await this.stripeService.confirmCardPayment(
        session.data['client_secret'] as string,
        session.data['payment_method_id'] as string
      );

      if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
        // Place order
        const order = await this.cartService.placeOrder();
        
        if (order?.type === 'order') {
          const countryCode = order.order.shipping_address?.country_code?.toLowerCase() || 'us';
          this.router.navigate([`/order/confirmed/${order.order.id}`]);
        } else {
          throw new Error('Order creation failed');
        }
      } else {
        throw new Error('Payment was not successful');
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async changeCard() {
    try {
      this.isProcessing.set(true);
      const cart = this.cart();
      const session = cart?.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
      
      if (session) {
        await this.cartService.setPaymentMethod(session.id, { token: null });
        await this.cartService.retrieveCart();
        setTimeout(() => this.initializeStripeCard(), 100);
      }
    } catch (error) {
      console.error('Error changing card:', error);
      this.error.set(error instanceof Error ? error.message : 'Failed to change card');
    } finally {
      this.isProcessing.set(false);
    }
  }

  continueToReview() {
    this.router.navigate(['/checkout'], { queryParams: { step: 'review' } });
  }

  getPaymentMethodName(providerId: string): string {
    if (this.stripeService.isStripeProvider(providerId)) {
      return 'Credit Card';
    }
    if (providerId.includes('paypal')) {
      return 'PayPal';
    }
    if (providerId.includes('manual')) {
      return 'Test Payment';
    }
    return 'Payment';
  }

  getCardLast4(): string {
    const cart = this.cart();
    const session = cart?.payment_collection?.payment_sessions?.find(s => s.status === 'pending');
    const card = session?.data?.['card'] as { last4?: string } | undefined;
    return card?.last4 || '****';
  }
} 