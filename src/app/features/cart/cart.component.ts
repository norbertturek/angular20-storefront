import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart">
      <div class="container">
        <h1>Shopping Cart</h1>
        <p>Cart functionality will be implemented here</p>
      </div>
    </div>
  `,
  styles: [`
    .cart {
      padding: 2rem 0;
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
    }
  `]
})
export class CartComponent {} 