import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpTypes } from '@medusajs/types';
import { ProductsService } from '../../core/services/products.service';
import { ProductTypesService } from '../../core/services/product-types.service';
import { CollectionsService } from '../../core/services/collections.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegionsService } from '../../core/services/regions.service';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductCardComponent],
  template: `
    <div class="store">
      <div class="container">
        <div class="store-header">
          <h1>{{ pageTitle() }}</h1>
          @if (pageDescription()) {
            <p>{{ pageDescription() }}</p>
          }
        </div>

        @if (!isLoading()) {
          <div class="filters">
            <div class="filter-group">
              <label for="productType">Product Type:</label>
              <select id="productType" [(ngModel)]="selectedType" (change)="onFilterChange()">
                <option value="">All Types</option>
                @for (type of productTypes(); track type.id) {
                  <option [value]="type.value">{{ type.value }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label for="collection">Collection:</label>
              <select id="collection" [(ngModel)]="selectedCollection" (change)="onFilterChange()">
                <option value="">All Collections</option>
                @for (collection of collections(); track collection.id) {
                  <option [value]="collection.handle">{{ collection.title }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label for="search">Search:</label>
              <input 
                type="text" 
                id="search" 
                [(ngModel)]="searchQuery" 
                (input)="onSearchChange()"
                placeholder="Search products..."
              />
            </div>
          </div>
        }

        <div class="results-info">
          @if (totalProducts() > 0) {
            <span>
              Showing {{ products().length }} of {{ totalProducts() }} products
            </span>
          }
        </div>

        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Loading products...</p>
            </div>
          </div>
        }

        @if (error() && !isLoading()) {
          <div class="error-state">
            <div class="error-message">
              <h2>Oops! Something went wrong</h2>
              <p>{{ error() }}</p>
              <button (click)="loadProducts()" class="retry-button">Try Again</button>
            </div>
          </div>
        }

        @if (!isLoading() && !error()) {
          <div class="products-section">
            @if (products().length === 0) {
              <div class="empty-state">
                <h2>No products found</h2>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            }

            @if (products().length > 0) {
              <div class="products-grid">
                @for (product of products(); track product.id) {
                  <div class="product-item">
                    <app-product-card [product]="product"></app-product-card>
                  </div>
                }
              </div>
            }

            @if (hasMoreProducts() && products().length > 0) {
              <div class="load-more">
                <button 
                  (click)="loadMoreProducts()" 
                  [disabled]="isLoadingMore()"
                  class="load-more-btn"
                >
                  @if (!isLoadingMore()) {
                    <span>Load More Products</span>
                  } @else {
                    <span>Loading...</span>
                  }
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private productTypesService = inject(ProductTypesService);
  private collectionsService = inject(CollectionsService);
  private regionsService = inject(RegionsService);
  private destroyRef = inject(DestroyRef);

  // Signals for state management
  products = signal<HttpTypes.StoreProduct[]>([]);
  productTypes = signal<HttpTypes.StoreProductType[]>([]);
  collections = signal<HttpTypes.StoreCollection[]>([]);
  
  selectedType: string = '';
  selectedCollection: string = '';
  searchQuery: string = '';
  
  isLoading = signal(true);
  isLoadingMore = signal(false);
  error = signal<string | null>(null);
  
  totalProducts = signal(0);
  currentPage = 1;
  hasMoreProducts = signal(false);
  
  // Computed signals
  pageTitle = computed(() => {
    if (this.selectedType) {
      return this.selectedType;
    }
    if (this.selectedCollection) {
      const collection = this.collections().find(c => c.handle === this.selectedCollection);
      return collection?.title || 'Collection';
    }
    if (this.searchQuery) {
      return `Search results for "${this.searchQuery}"`;
    }
    return 'All Products';
  });

  pageDescription = computed(() => {
    if (this.selectedCollection) {
      const collection = this.collections().find(c => c.handle === this.selectedCollection);
      return collection?.metadata?.['description'] as string || null;
    }
    return null;
  });
  
  private searchTimeout: any;

  ngOnInit() {
    this.loadFilters();
    this.handleRouteParams();
  }

  private handleRouteParams() {
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      this.selectedType = params['type'] || '';
      this.selectedCollection = params['collection'] || '';
      this.searchQuery = params['q'] || '';
      this.loadProducts();
    });
  }

  async loadFilters() {
    try {
      const [productTypesResponse, collectionsResponse] = await Promise.all([
        this.productTypesService.getProductTypesList({ limit: 50 }),
        this.collectionsService.getCollectionsList({ limit: 50 })
      ]);

      this.productTypes.set(productTypesResponse.productTypes);
      this.collections.set(collectionsResponse.collections);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  }

  async loadProducts(reset: boolean = true) {
    try {
      if (reset) {
        this.isLoading.set(true);
        this.currentPage = 1;
        this.products.set([]);
      } else {
        this.isLoadingMore.set(true);
      }
      
      this.error.set(null);

      // Get the current region for proper pricing (use the first available region - Europe)
      const regions = await this.regionsService.listRegions();
      const region = regions.length > 0 ? regions[0] : null;
      const regionId = region?.id;

      const params: any = {
        limit: 12,
        offset: (this.currentPage - 1) * 12,
        fields: '*variants.calculated_price,+variants.inventory_quantity'
      };

      if (regionId) {
        params.region_id = regionId;
      }

      if (this.selectedType) {
        const selectedTypeObj = this.productTypes().find(t => t.value === this.selectedType);
        if (selectedTypeObj) {
          params.type_id = [selectedTypeObj.id];
        }
      }

      if (this.selectedCollection) {
        const selectedCollectionObj = this.collections().find(c => c.handle === this.selectedCollection);
        if (selectedCollectionObj) {
          params.collection_id = [selectedCollectionObj.id];
        }
      }

      if (this.searchQuery.trim()) {
        params.q = this.searchQuery.trim();
      }

      const response = await this.productsService.getProductsList(params);
      
      if (reset) {
        this.products.set(response.products);
      } else {
        this.products.set([...this.products(), ...response.products]);
      }
      
      this.totalProducts.set(response.count);
      this.hasMoreProducts.set(response.nextPage !== null);
      
      if (!reset) {
        this.currentPage++;
      }
      
    } catch (error) {
      console.error('Error loading products:', error);
      this.error.set('Failed to load products. Please try again.');
    } finally {
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
    }
  }

  async loadMoreProducts() {
    if (!this.hasMoreProducts() || this.isLoadingMore()) return;
    
    this.currentPage++;
    await this.loadProducts(false);
  }

  onFilterChange() {
    this.loadProducts();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProducts();
    }, 500);
  }
} 