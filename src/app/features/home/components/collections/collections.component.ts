import { Component, input } from '@angular/core';

import { ProductCardComponent } from '@sharedComponents/product-card/product-card.component';
import { LoadingSpinnerComponent } from '@ui/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '@ui/button/button.component';
import { TitleComponent } from '@ui/title/title.component';

import { HttpTypes } from '@medusajs/types';

export type Collection = HttpTypes.StoreCollection;
export type Product = HttpTypes.StoreProduct;

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [TitleComponent, ButtonComponent, ProductCardComponent, LoadingSpinnerComponent],
  template: `
    @if (collections().length > 0) {
      <section class="collections">
        <div class="container">
          <app-title text="Featured Collections"/>
          <div class="collections-grid">
            @for (collection of collections(); track collection.id) {
              <div class="collection-section">
                <div class="collection-header">
                  <h3>{{ collection.title }}</h3>
                  @if (collection.metadata?.['description']) {
                    <p>{{ collection.metadata!['description'] }}</p>
                  }
                </div>
                
                @if (hasCollectionImage(collection)) {
                  <div class="collection-image">
                    <img 
                      [src]="getCollectionImageUrl(collection)" 
                      [alt]="collection.title"
                    />
                  </div>
                }
                
                @if (getCollectionProducts(collection).length > 0) {
                  @defer {
                    <div class="collection-products">
                      <div class="products-grid">
                        @for (product of previewProducts()[collection.id]; track product.id) {
                          <div class="product-item">
                            <app-product-card [product]="product" size="small"></app-product-card>
                          </div>
                        }
                      </div>
                      <div class="view-all">
                        <app-button routerLink="/products" [queryParams]="{collection: collection.handle}" label="View All" variant="secondary" /> 
                      </div>
                    </div>
                  } @placeholder {
                    <div class="collection-products-loading">
                      <app-loading-spinner message="Loading products..." variant="compact"></app-loading-spinner>
                    </div>
                  } @loading {
                    <div class="collection-products-loading">
                      <app-loading-spinner message="Loading products..." variant="compact"></app-loading-spinner>
                    </div>
                  } @error {
                    <div class="collection-products-error">
                      <p>Failed to load products. Please try again.</p>
                    </div>
                  }
                }
              </div>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .collections {
      padding: 4rem 0;
      background-color: white;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .collections-grid {
      display: grid;
      gap: 4rem;
      margin-top: 2rem;
    }

    .collection-section {
      width: 100%;
    }

    .collection-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .collection-header h3 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #1a1a1a;
    }

    .collection-header p {
      color: #666;
      margin: 0;
      line-height: 1.5;
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .collection-image {
      margin-bottom: 2rem;
      border-radius: 12px;
      overflow: hidden;
    }

    .collection-image img {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }

    .collection-products {
      margin-top: 2rem;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .product-item {
      min-width: 0;
    }

    .view-all {
      text-align: center;
    }

    .collection-products-loading,
    .collection-products-error {
      text-align: center;
      padding: 2rem;
      color: #666;
    }



    @media (max-width: 768px) {
      .collections {
        padding: 2rem 0;
      }

      .collections-grid {
        gap: 3rem;
      }

      .collection-header h3 {
        font-size: 1.5rem;
      }

      .collection-image img {
        height: 200px;
      }

      .products-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
      }
    }
  `]
})
export class CollectionsComponent {
  collections = input<Collection[]>([]);
  previewProducts = input<Record<string, Product[]>>({});

  hasCollectionImage(collection: Collection): boolean {
    return collection.metadata?.['image_url'] !== undefined;
  }

  getCollectionImageUrl(collection: Collection): string {
    return (collection.metadata?.['image_url'] as string) || '';
  }

  getCollectionProducts(collection: Collection): Product[] {
    return this.previewProducts()[collection.id] || [];
  }
} 