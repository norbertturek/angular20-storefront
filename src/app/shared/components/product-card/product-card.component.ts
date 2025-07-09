import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpTypes } from '@medusajs/types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="product-card" [class.small]="size === 'small'">
      <div class="product-link">
        <a [routerLink]="['/products', product.handle || product.id]">
          <div class="product-image">
            @if (imageUrl) {
              <img 
                [src]="imageUrl" 
                [alt]="product.title"
                class="product-img"
              />
            } @else {
              <div class="image-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
            }
          </div>
        </a>
        
        <div class="product-info">
          <div class="product-content">
            <div class="product-text">
              <h3 class="product-title">
                <a [routerLink]="['/products', product.handle || product.id]">
                  {{ product.title }}
                </a>
              </h3>
              
              @if (product.collection) {
                <a 
                  [routerLink]="['/store']" 
                  [queryParams]="{collection: product.collection.handle}"
                  class="product-collection"
                >
                  {{ product.collection.title }}
                </a>
              }
            </div>
            
            @if (cheapestPrice) {
              <div class="product-price">
                @if (hasReducedPrice) {
                  <div>
                    <span class="original-price">{{ formatCurrency(cheapestPrice.original_amount || 0) }}</span>
                    <span class="sale-price">{{ formatCurrency(cheapestPrice.calculated_amount || 0) }}</span>
                  </div>
                } @else {
                  <span class="price">{{ formatCurrency(cheapestPrice.calculated_amount || 0) }}</span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: HttpTypes.StoreProduct;
  @Input() size: 'normal' | 'small' = 'normal';

  get imageUrl(): string | null {
    if (this.product.thumbnail) {
      return this.product.thumbnail;
    }
    
    if (this.product.images && this.product.images.length > 0) {
      return this.product.images[0].url;
    }
    
    return null;
  }

  get cheapestPrice(): any {
    if (!this.product.variants || this.product.variants.length === 0) {
      return null;
    }

    let cheapest = this.product.variants[0].calculated_price;
    
    for (const variant of this.product.variants) {
      if (variant.calculated_price && 
          (variant.calculated_price.calculated_amount || 0) < (cheapest?.calculated_amount || Infinity)) {
        cheapest = variant.calculated_price;
      }
    }

    return cheapest;
  }

  get hasReducedPrice(): boolean {
    if (!this.cheapestPrice) return false;
    const originalAmount = this.cheapestPrice.original_amount || 0;
    const calculatedAmount = this.cheapestPrice.calculated_amount || 0;
    return originalAmount > calculatedAmount;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
} 