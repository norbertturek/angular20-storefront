import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkout-form">
      <div class="steps-indicator">
        <div class="step" [class.active]="currentStep === 'email'" [class.completed]="isStepCompleted('email')">
          <div class="step-number">1</div>
          <div class="step-label">Contact</div>
        </div>
        <div class="step" [class.active]="currentStep === 'delivery'" [class.completed]="isStepCompleted('delivery')">
          <div class="step-number">2</div>
          <div class="step-label">Delivery</div>
        </div>
        <div class="step" [class.active]="currentStep === 'shipping'" [class.completed]="isStepCompleted('shipping')">
          <div class="step-number">3</div>
          <div class="step-label">Shipping</div>
        </div>
        <div class="step" [class.active]="currentStep === 'payment'" [class.completed]="isStepCompleted('payment')">
          <div class="step-number">4</div>
          <div class="step-label">Payment</div>
        </div>
        <div class="step" [class.active]="currentStep === 'review'" [class.completed]="isStepCompleted('review')">
          <div class="step-number">5</div>
          <div class="step-label">Review</div>
        </div>
      </div>

      <div class="form-content">
        @switch (currentStep) {
          @case ('email') {
            <div class="step-content">
              <h2 class="step-title">Contact Information</h2>
              <form (ngSubmit)="onEmailSubmit()" class="form">
                <div class="form-group">
                  <label for="email">Email address</label>
                  <input
                    type="email"
                    id="email"
                    [(ngModel)]="emailForm.email"
                    name="email"
                    required
                    class="form-input"
                    placeholder="Enter your email"
                  />
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="!emailForm.email">
                    Continue to delivery
                  </button>
                </div>
              </form>
            </div>
          }
          
          @case ('delivery') {
            <div class="step-content">
              <h2 class="step-title">Delivery Address</h2>
              <form (ngSubmit)="onDeliverySubmit()" class="form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName">First name</label>
                    <input
                      type="text"
                      id="firstName"
                      [(ngModel)]="deliveryForm.firstName"
                      name="firstName"
                      required
                      class="form-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="lastName">Last name</label>
                    <input
                      type="text"
                      id="lastName"
                      [(ngModel)]="deliveryForm.lastName"
                      name="lastName"
                      required
                      class="form-input"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label for="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    [(ngModel)]="deliveryForm.address"
                    name="address"
                    required
                    class="form-input"
                    placeholder="Street address"
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="city">City</label>
                    <input
                      type="text"
                      id="city"
                      [(ngModel)]="deliveryForm.city"
                      name="city"
                      required
                      class="form-input"
                    />
                  </div>
                  <div class="form-group">
                    <label for="postalCode">Postal code</label>
                    <input
                      type="text"
                      id="postalCode"
                      [(ngModel)]="deliveryForm.postalCode"
                      name="postalCode"
                      required
                      class="form-input"
                    />
                  </div>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" (click)="goToStep('email')">
                    Back
                  </button>
                  <button type="submit" class="btn btn-primary" [disabled]="!isDeliveryFormValid()">
                    Continue to shipping
                  </button>
                </div>
              </form>
            </div>
          }
          
          @case ('shipping') {
            <div class="step-content">
              <h2 class="step-title">Shipping Method</h2>
              <div class="shipping-options">
                <div class="shipping-option" [class.selected]="selectedShipping === 'standard'">
                  <input
                    type="radio"
                    id="standard"
                    value="standard"
                    [(ngModel)]="selectedShipping"
                    name="shipping"
                  />
                  <label for="standard" class="shipping-label">
                    <div class="shipping-info">
                      <div class="shipping-name">Standard Shipping</div>
                      <div class="shipping-time">5-7 business days</div>
                    </div>
                    <div class="shipping-price">Free</div>
                  </label>
                </div>
                <div class="shipping-option" [class.selected]="selectedShipping === 'express'">
                  <input
                    type="radio"
                    id="express"
                    value="express"
                    [(ngModel)]="selectedShipping"
                    name="shipping"
                  />
                  <label for="express" class="shipping-label">
                    <div class="shipping-info">
                      <div class="shipping-name">Express Shipping</div>
                      <div class="shipping-time">2-3 business days</div>
                    </div>
                    <div class="shipping-price">€9.99</div>
                  </label>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="goToStep('delivery')">
                  Back
                </button>
                <button type="button" class="btn btn-primary" [disabled]="!selectedShipping" (click)="onShippingSubmit()">
                  Continue to payment
                </button>
              </div>
            </div>
          }
          
          @case ('payment') {
            <div class="step-content">
              <h2 class="step-title">Payment Information</h2>
              <div class="payment-methods">
                <div class="payment-method" [class.selected]="selectedPayment === 'card'">
                  <input
                    type="radio"
                    id="card"
                    value="card"
                    [(ngModel)]="selectedPayment"
                    name="payment"
                  />
                  <label for="card">Credit Card</label>
                </div>
                <div class="payment-method" [class.selected]="selectedPayment === 'paypal'">
                  <input
                    type="radio"
                    id="paypal"
                    value="paypal"
                    [(ngModel)]="selectedPayment"
                    name="payment"
                  />
                  <label for="paypal">PayPal</label>
                </div>
              </div>
              
              @if (selectedPayment === 'card') {
                <form (ngSubmit)="onPaymentSubmit()" class="form">
                  <div class="form-group">
                    <label for="cardNumber">Card number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      [(ngModel)]="paymentForm.cardNumber"
                      name="cardNumber"
                      required
                      class="form-input"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="expiryDate">Expiry date</label>
                      <input
                        type="text"
                        id="expiryDate"
                        [(ngModel)]="paymentForm.expiryDate"
                        name="expiryDate"
                        required
                        class="form-input"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div class="form-group">
                      <label for="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        [(ngModel)]="paymentForm.cvv"
                        name="cvv"
                        required
                        class="form-input"
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn btn-secondary" (click)="goToStep('shipping')">
                      Back
                    </button>
                    <button type="submit" class="btn btn-primary" [disabled]="!isPaymentFormValid()">
                      Continue to review
                    </button>
                  </div>
                </form>
              } @else if (selectedPayment === 'paypal') {
                <div class="paypal-section">
                  <p>You will be redirected to PayPal to complete your payment.</p>
                  <div class="form-actions">
                    <button type="button" class="btn btn-secondary" (click)="goToStep('shipping')">
                      Back
                    </button>
                    <button type="button" class="btn btn-primary" (click)="onPaymentSubmit()">
                      Continue to review
                    </button>
                  </div>
                </div>
              }
            </div>
          }
          
          @case ('review') {
            <div class="step-content">
              <h2 class="step-title">Review Your Order</h2>
              <div class="review-section">
                <div class="review-item">
                  <h3>Contact</h3>
                  <p>{{ emailForm.email }}</p>
                  <button type="button" class="edit-btn" (click)="goToStep('email')">Edit</button>
                </div>
                <div class="review-item">
                  <h3>Delivery Address</h3>
                  <p>{{ deliveryForm.firstName }} {{ deliveryForm.lastName }}</p>
                  <p>{{ deliveryForm.address }}</p>
                  <p>{{ deliveryForm.city }}, {{ deliveryForm.postalCode }}</p>
                  <button type="button" class="edit-btn" (click)="goToStep('delivery')">Edit</button>
                </div>
                <div class="review-item">
                  <h3>Shipping Method</h3>
                  <p>{{ selectedShipping === 'standard' ? 'Standard Shipping (5-7 days)' : 'Express Shipping (2-3 days)' }}</p>
                  <button type="button" class="edit-btn" (click)="goToStep('shipping')">Edit</button>
                </div>
                <div class="review-item">
                  <h3>Payment Method</h3>
                  <p>{{ selectedPayment === 'card' ? 'Credit Card' : 'PayPal' }}</p>
                  <button type="button" class="edit-btn" (click)="goToStep('payment')">Edit</button>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="goToStep('payment')">
                  Back
                </button>
                <button type="button" class="btn btn-primary btn-large" (click)="onPlaceOrder()">
                  Place Order
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .checkout-form {
      max-width: 600px;
    }

    .steps-indicator {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3rem;
      padding: 0 1rem;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
    }

    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 15px;
      right: -50%;
      width: 100%;
      height: 2px;
      background-color: #e5e7eb;
      z-index: 1;
    }

    .step.completed:not(:last-child)::after {
      background-color: #10b981;
    }

    .step-number {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      z-index: 2;
      position: relative;
    }

    .step.active .step-number {
      background-color: #3b82f6;
      color: white;
    }

    .step.completed .step-number {
      background-color: #10b981;
      color: white;
    }

    .step-label {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
    }

    .step.active .step-label {
      color: #3b82f6;
      font-weight: 600;
    }

    .form-content {
      background-color: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .step-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #1f2937;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-group {
      flex: 1;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-secondary {
      background-color: #f9fafb;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background-color: #f3f4f6;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.125rem;
    }

    .shipping-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .shipping-option {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 1rem;
      transition: border-color 0.2s;
    }

    .shipping-option.selected {
      border-color: #3b82f6;
      background-color: #f0f9ff;
    }

    .shipping-option input[type="radio"] {
      display: none;
    }

    .shipping-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }

    .shipping-name {
      font-weight: 500;
      color: #1f2937;
    }

    .shipping-time {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .shipping-price {
      font-weight: 600;
      color: #1f2937;
    }

    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .payment-method {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 1rem;
      transition: border-color 0.2s;
    }

    .payment-method.selected {
      border-color: #3b82f6;
      background-color: #f0f9ff;
    }

    .payment-method input[type="radio"] {
      margin-right: 0.75rem;
    }

    .payment-method label {
      cursor: pointer;
      font-weight: 500;
    }

    .paypal-section {
      padding: 2rem;
      background-color: #f9fafb;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 2rem;
    }

    .review-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .review-item {
      padding: 1rem;
      background-color: #f9fafb;
      border-radius: 8px;
      position: relative;
    }

    .review-item h3 {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }

    .review-item p {
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .edit-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      font-size: 0.875rem;
      text-decoration: underline;
    }

    .edit-btn:hover {
      color: #2563eb;
    }

    @media (max-width: 640px) {
      .steps-indicator {
        padding: 0;
      }
      
      .step-label {
        font-size: 0.625rem;
      }
      
      .form-row {
        flex-direction: column;
      }
      
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CheckoutFormComponent {
  @Input() cart: any;
  @Input() currentStep: string = 'email';
  @Output() stepChange = new EventEmitter<string>();

  emailForm = {
    email: ''
  };

  deliveryForm = {
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: ''
  };

  selectedShipping = '';
  selectedPayment = '';

  paymentForm = {
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  };

  isLoading = signal(false);

  goToStep(step: string) {
    this.stepChange.emit(step);
  }

  isStepCompleted(step: string): boolean {
    const steps = ['email', 'delivery', 'shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(this.currentStep);
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex;
  }

  onEmailSubmit() {
    if (this.emailForm.email) {
      this.goToStep('delivery');
    }
  }

  onDeliverySubmit() {
    if (this.isDeliveryFormValid()) {
      this.goToStep('shipping');
    }
  }

  onShippingSubmit() {
    if (this.selectedShipping) {
      this.goToStep('payment');
    }
  }

  onPaymentSubmit() {
    if (this.selectedPayment === 'paypal' || this.isPaymentFormValid()) {
      this.goToStep('review');
    }
  }

  onPlaceOrder() {
    this.isLoading.set(true);
    
    // Simulate order placement
    setTimeout(() => {
      this.isLoading.set(false);
      alert('Order placed successfully! You will receive a confirmation email shortly.');
      // In real app, redirect to order confirmation page
    }, 2000);
  }

  isDeliveryFormValid(): boolean {
    return !!(
      this.deliveryForm.firstName &&
      this.deliveryForm.lastName &&
      this.deliveryForm.address &&
      this.deliveryForm.city &&
      this.deliveryForm.postalCode
    );
  }

  isPaymentFormValid(): boolean {
    return !!(
      this.paymentForm.cardNumber &&
      this.paymentForm.expiryDate &&
      this.paymentForm.cvv
    );
  }
} 