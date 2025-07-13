import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '@ui/button/button.component';

@Component({
    selector: 'app-quantity-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    template: `
    <div class="quantity-selector" [class.small]="size() === 'small'">
      <label for="quantity" class="quantity-label">Quantity:</label>
      <div class="quantity-controls">
        <app-button 
          (clicked)="decreaseQuantity()"
          [disabled]="quantity() <= 1"
          label="-"
          variant="secondary"
          [size]="size() === 'small' ? 'compact' : 'small'"
        ></app-button>
        <input 
          type="number" 
          id="quantity"
          [ngModel]="quantity()"
          (ngModelChange)="setQuantity($event)"
          [min]="1"
          [max]="maxQuantity()"
          class="quantity-input"
        />
        <app-button 
          (clicked)="increaseQuantity()"
          [disabled]="quantity() >= maxQuantity()"
          label="+"
          variant="secondary"
          [size]="size() === 'small' ? 'compact' : 'small'"
        ></app-button>
      </div>
    </div>
  `,
    styles: [`
    .quantity-selector {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quantity-label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .quantity-input {
      width: 45px;
      height: 36px;
      text-align: center;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      background-color: white;
      transition: border-color 0.2s ease;
    }

    .quantity-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .quantity-input::-webkit-outer-spin-button,
    .quantity-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .quantity-input[type=number] {
      -moz-appearance: textfield;
    }

    /* Small variant */
    .quantity-selector.small {
      .quantity-label {
        font-size: 0.75rem;
      }

      .quantity-controls {
        gap: 0.25rem;
      }

      .quantity-input {
        width: 35px;
        height: 28px;
        font-size: 0.75rem;
      }
    }

    @media (max-width: 768px) {
      .quantity-controls {
        gap: 0.375rem;
      }

      .quantity-input {
        width: 40px;
        height: 32px;
        font-size: 0.75rem;
      }

      .quantity-selector.small .quantity-input {
        width: 30px;
        height: 26px;
        font-size: 0.7rem;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuantitySelectorComponent {
    // Inputs
    initialQuantity = input<number>(1);
    maxQuantity = input<number>(99);
    size = input<'normal' | 'small'>('normal');

    // Outputs
    quantityChanged = output<number>();

    // Internal state
    quantity = signal<number>(1);

    // Initialize with input value and watch for changes
    initEffect = effect(() => {
        this.quantity.set(this.initialQuantity());
    });

    increaseQuantity() {
        if (this.quantity() < this.maxQuantity()) {
            const newQuantity = this.quantity() + 1;
            this.quantity.set(newQuantity);
            this.quantityChanged.emit(newQuantity);
        }
    }

    decreaseQuantity() {
        if (this.quantity() > 1) {
            const newQuantity = this.quantity() - 1;
            this.quantity.set(newQuantity);
            this.quantityChanged.emit(newQuantity);
        }
    }

    setQuantity(value: number) {
        const clampedValue = Math.max(1, Math.min(value, this.maxQuantity()));
        this.quantity.set(clampedValue);
        this.quantityChanged.emit(clampedValue);
    }
} 