import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ProductVariantSelectorComponent } from '../variant-selector/variant-selector.component';
import { HttpTypes } from '@medusajs/types';
import { QuantitySelectorComponent } from '@sharedComponents/quantity-selector/quantity-selector.component';
import { ButtonComponent } from '@ui/button/button.component';

@Component({
  selector: 'app-product-info',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonComponent, 
    ProductVariantSelectorComponent, 
    QuantitySelectorComponent
  ],
  template: `
    <div class="product-info">
      @if (product()?.collection) {
        <a 
          [routerLink]="['/products']" 
          [queryParams]="{collection: product()?.collection?.handle}"
          class="product-collection-link"
        >
          <p class="product-collection">{{ product()?.collection?.title }}</p>
        </a>
      }
      
      <h1 class="product-title">{{ product()?.title }}</h1>
      
      @if (selectedVariant()?.calculated_price) {
        <div class="product-price">
          @if (hasDiscountPrice()) {
            <div class="price-container">
              <span class="original-price">{{ selectedVariant()?.calculated_price?.original_amount || 0 | currency:'EUR' }}</span>
              <span class="sale-price">{{ selectedVariant()?.calculated_price?.calculated_amount || 0 | currency:'EUR' }}</span>
            </div>
          } @else {
            <span class="price">{{ selectedVariant()?.calculated_price?.calculated_amount || 0 | currency:'EUR' }}</span>
          }
        </div>
      }
      
      @if (product()?.description) {
        <div class="product-description">
          <p>{{ product()?.description }}</p>
        </div>
      }
      
      <app-variant-selector
        [variants]="productVariants()"
        [selectedVariantId]="selectedVariant()?.id || null"
        (variantSelected)="variantSelected.emit($event)"
      ></app-variant-selector>

      <div class="quantity-cart">
        <app-quantity-selector
          [initialQuantity]="quantity()"
          [maxQuantity]="maxQuantity()"
          (quantityChanged)="quantityChanged.emit($event)"
        ></app-quantity-selector>
        
        <app-button 
          [disabled]="!selectedVariant() || !isVariantAvailable(selectedVariant()!) || isAddingToCart()"
          [loading]="isAddingToCart()"
          [label]="isAddingToCart() ? 'Adding...' : 'Add to Cart'"
          variant="primary"
          size="small"
          (clicked)="addToCartClicked.emit()"
        ></app-button>
      </div>
      
      @if (addToCartMessage()) {
        <div class="cart-message" [class.success]="addToCartSuccess()">
          {{ addToCartMessage() }}
        </div>
      }

      <div class="product-details">
        @if (product()?.type) {
          <div class="detail-item">
            <strong>Type:</strong> {{ product()?.type?.value }}
          </div>
        }
        @if (productTags().length > 0) {
          <div class="detail-item">
            <strong>Tags:</strong>
            @for (tag of productTags(); track tag.id; let last = $last) {
              <span>{{ tag.value }}@if (!last) {<span>, </span>}</span>
            }
          </div>
        }
        @if (selectedVariant()?.sku) {
          <div class="detail-item">
            <strong>SKU:</strong> {{ selectedVariant()?.sku }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .product-info {
      flex: 1;
      max-width: 500px;
      padding-left: 2rem;
    }

    .product-collection-link {
      text-decoration: none;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .product-collection {
      color: #3b82f6;
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: color 0.2s ease;
      padding: 0.25rem 0.75rem;
      background-color: #eff6ff;
      border-radius: 4px;
      border: 1px solid #dbeafe;
    }

    .product-collection-link:hover .product-collection {
      color: #1d4ed8;
      background-color: #dbeafe;
      border-color: #93c5fd;
    }

    .product-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }

    .product-price {
      margin-bottom: 2rem;
    }

    .price-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .price {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .original-price {
      font-size: 1.2rem;
      color: #666;
      text-decoration: line-through;
    }

    .sale-price {
      font-size: 1.5rem;
      font-weight: 600;
      color: #dc3545;
    }

    .product-description {
      margin-bottom: 2rem;
    }

    .product-description p {
      color: #666;
      line-height: 1.6;
    }

    .quantity-cart {
      margin-bottom: 2rem;
      display: flex;
      align-items: flex-end;
      gap: 1rem;
    }

    .cart-message {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 4px;
    }

    .cart-message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .cart-message:not(.success) {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .product-details {
      margin-top: 2rem;
    }

    .detail-item {
      margin-bottom: 0.5rem;
    }

    .detail-item strong {
      color: #1a1a1a;
    }

    @media (max-width: 768px) {
      .product-info {
        padding-left: 0;
        padding-top: 2rem;
        max-width: 100%;
      }

      .product-title {
        font-size: 1.5rem;
      }

      .quantity-cart {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductInfoComponent {
  // Inputs
  product = input<HttpTypes.StoreProduct | null>(null);
  selectedVariant = input<HttpTypes.StoreProductVariant | null>(null);
  quantity = input<number>(1);
  maxQuantity = input<number>(99);
  isAddingToCart = input<boolean>(false);
  addToCartMessage = input<string | null>(null);
  addToCartSuccess = input<boolean>(false);

  // Outputs
  variantSelected = output<HttpTypes.StoreProductVariant>();
  quantityChanged = output<number>();
  addToCartClicked = output<void>();

  // Computed
  productVariants = computed(() => this.product()?.variants || []);
  productTags = computed(() => this.product()?.tags || []);

  hasDiscountPrice = computed(() => {
    const variant = this.selectedVariant();
    if (!variant?.calculated_price) return false;
    
    const original = variant.calculated_price.original_amount;
    const calculated = variant.calculated_price.calculated_amount;
    
    return original && calculated && original > calculated;
  });

  isVariantAvailable(variant: HttpTypes.StoreProductVariant): boolean {
    // If inventory is not managed, treat as available
    if (!variant.manage_inventory) {
      return true;
    }
    
    // If inventory_quantity is null or undefined, treat as available
    if (variant.inventory_quantity === null || variant.inventory_quantity === undefined) {
      return true;
    }
    
    return variant.inventory_quantity > 0;
  }
} 