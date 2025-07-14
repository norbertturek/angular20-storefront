import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductTypesService } from '@api/product-types.service';

import { TitleComponent } from '@ui/title/title.component';

import { HttpTypes } from '@medusajs/types';

export type ProductType = HttpTypes.StoreProductType;

@Component({
  selector: 'app-product-types',
  standalone: true,
  imports: [RouterLink, TitleComponent],
  template: `
    @if (productTypes().length > 0) {
      <section class="product-types">
        <div class="container">
          <app-title label="Our Products" />
          <div class="types-grid">
            @for (type of productTypes(); track type.id) {
              <a [routerLink]="['/products']" [queryParams]="{type: type.value}" class="type-item">
                <div class="type-image">
                  @if (hasProductTypeImage(type)) {
                    <img 
                      [src]="getProductTypeImageUrl(type)" 
                      [alt]="type.value"
                      loading="lazy"
                    />
                  } @else {
                    <div class="image-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                    </div>
                  }
                  <div class="type-overlay">
                    <h3>{{ type.value }}</h3>
                  </div>
                </div>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .product-types {
      padding: 4rem 0;
      background-color: white;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .type-item {
      display: block;
      text-decoration: none;
      color: inherit;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      transition: transform 0.2s ease;
    }

    .type-item:hover {
      transform: translateY(-2px);
    }

    .type-image {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      overflow: hidden;
      background-color: #f9fafb;
    }

    .type-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .type-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .type-overlay h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: white;
      text-align: center;
      line-height: 1.3;
      text-transform: capitalize;
    }

    @media (max-width: 768px) {
      .product-types {
        padding: 2rem 0;
      }

      .types-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .type-image {
        aspect-ratio: 16/9;
      }

      .type-overlay h3 {
        font-size: 0.875rem;
      }
    }
  `]
})
export class ProductTypesComponent {
  productTypes = input<ProductType[]>([]);
  private productTypesService = inject(ProductTypesService);

  hasProductTypeImage(type: ProductType): boolean {
    return this.productTypesService.hasProductTypeImage(type);
  }

  getProductTypeImageUrl(type: ProductType): string {
    return this.productTypesService.getProductTypeImageUrl(type) || '';
  }
} 