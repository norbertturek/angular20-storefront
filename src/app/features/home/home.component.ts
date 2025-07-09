import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpTypes } from '@medusajs/types';
import { ProductTypesService } from '../../core/services/product-types.service';
import { CollectionsService } from '../../core/services/collections.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  template: `
    <div class="home">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="container">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error() && !isLoading()) {
        <div class="error-state">
          <div class="container">
            <div class="error-message">
              <h2>Oops! Something went wrong</h2>
              <p>{{ error() }}</p>
              <button (click)="loadData()" class="retry-button">Try Again</button>
            </div>
          </div>
        </div>
      }

      <!-- Main Content -->
      @if (!isLoading() && !error()) {
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero-image">
            <img src="/images/content/living-room-gray-armchair-two-seater-sofa.png" alt="Living room with gray armchair and two-seater sofa" />
          </div>
          <div class="hero-content">
            <div class="container">
              <h1>Elevate Your Living Space with Unmatched Comfort & Style</h1>
              <p>Discover Your Perfect Sofa Today</p>
              <a routerLink="/store" class="cta-button">Explore Now</a>
            </div>
          </div>
        </section>

        <!-- Product Types Section -->
        @if (productTypes().length > 0) {
          <section class="product-types">
            <div class="container">
              <h2>Our Products</h2>
              <div class="product-grid">
                @for (type of productTypes(); track type.id; let i = $index) {
                  <div class="product-type-card">
                    <a [routerLink]="['/store']" [queryParams]="{type: type.value}">
                      <div class="card-image">
                        @if (hasProductTypeImage(type)) {
                          <img 
                            [src]="getProductTypeImageUrl(type)" 
                            [alt]="type.value"
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
                      <h3>{{ type.value }}</h3>
                    </a>
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- Collections Section -->
        @if (collections().length > 0) {
          <section class="collections">
            <div class="container">
              <h2>Featured Collections</h2>
              <div class="collections-grid">
                @for (collection of collections(); track collection.id) {
                  <div class="collection-card">
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
                      <div class="collection-products">
                        <div class="products-grid">
                          @for (product of getCollectionProducts(collection).slice(0, 3); track product.id) {
                            <div class="product-item">
                              <app-product-card [product]="product" size="small"></app-product-card>
                            </div>
                          }
                        </div>
                        <div class="view-all">
                          <a [routerLink]="['/store']" [queryParams]="{collection: collection.handle}">
                            View All {{ collection.title }}
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </section>
        }

        <!-- About Section -->
        <section class="about-preview">
          <div class="container">
            <div class="about-content">
              <div class="about-text">
                <h2>About Sofa Society</h2>
                <p>At Sofa Society, we believe that a sofa is the heart of every home. We are dedicated to delivering high-quality, thoughtfully designed sofas that merge comfort and style effortlessly.</p>
                <a routerLink="/about" class="learn-more">Learn More</a>
              </div>
              <div class="about-image">
                <img src="/images/content/gray-sofa-against-concrete-wall.png" alt="Gray sofa against concrete wall" />
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private productTypesService = inject(ProductTypesService);
  private collectionsService = inject(CollectionsService);

  productTypes = signal<HttpTypes.StoreProductType[]>([]);
  collections = signal<HttpTypes.StoreCollection[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Load product types and collections in parallel
      const [productTypesResponse, collectionsResponse] = await Promise.all([
        this.productTypesService.getProductTypesList({ 
          limit: 20,
          fields: ['id', 'value', 'metadata']
        }),
        this.collectionsService.getCollectionsWithProducts()
      ]);

      this.productTypes.set(productTypesResponse.productTypes);
      this.collections.set(collectionsResponse);
      
    } catch (error) {
      console.error('Error loading home data:', error);
      this.error.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getProductTypeImageUrl(productType: HttpTypes.StoreProductType): string | null {
    return this.productTypesService.getProductTypeImageUrl(productType);
  }

  hasProductTypeImage(productType: HttpTypes.StoreProductType): boolean {
    return this.productTypesService.hasProductTypeImage(productType);
  }

  getCollectionImageUrl(collection: HttpTypes.StoreCollection): string | null {
    return this.collectionsService.getCollectionImageUrl(collection);
  }

  hasCollectionImage(collection: HttpTypes.StoreCollection): boolean {
    return this.collectionsService.hasCollectionImage(collection);
  }

  getCollectionProducts(collection: HttpTypes.StoreCollection): HttpTypes.StoreProduct[] {
    return collection.products || [];
  }
} 