import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpTypes } from '@medusajs/types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  product = input<HttpTypes.StoreProduct>();
  size = input<'normal' | 'small'>('normal');

  get imageUrl(): string | null {
    const product = this.product();
    if (!product) return null;
    
    if (product.thumbnail) {
      return product.thumbnail;
    }
    
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    
    return null;
  }

  get cheapestPrice(): any {
    const product = this.product();
    if (!product || !product.variants || product.variants.length === 0) {
      return null;
    }

    let cheapest = product.variants[0].calculated_price;
    
    for (const variant of product.variants) {
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
} 