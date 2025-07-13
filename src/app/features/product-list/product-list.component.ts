import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { injectProductTypesService } from '@api/product-types.service';
import { injectRegionsService } from '@api/regions.service';
import { injectCollectionsService } from '@services/collections.service';
import { ProductsService } from '../products/products.service';

import { HttpTypes } from '@medusajs/types';

import { ProductCardComponent } from '@sharedComponents/product-card/product-card.component';
import { ButtonComponent } from '@ui/button/button.component';
import { FilterState, ProductListFiltersComponent } from './components/filters/product-list-filters.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductCardComponent, ButtonComponent, ProductListFiltersComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly productTypesService = injectProductTypesService();
  private readonly collectionsService = injectCollectionsService();
  private readonly regionsService = injectRegionsService();

  // State signals
  readonly currentFilters = signal<FilterState>({ productType: '', collection: '', search: '' });
  readonly products = signal<HttpTypes.StoreProduct[]>([]);
  readonly productTypes = signal<HttpTypes.StoreProductType[]>([]);
  readonly collections = signal<HttpTypes.StoreCollection[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalProducts = signal(0);
  readonly hasMoreProducts = signal(false);

  // Route signals
  readonly queryParams = toSignal(this.route.queryParams, { 
    initialValue: this.route.snapshot.queryParams 
  });

  // Computed values
  readonly productTypesMap = computed(() => {
    return this.productTypes().reduce((acc, type) => {
      acc[type.value] = type;
      return acc;
    }, {} as Record<string, HttpTypes.StoreProductType>);
  });

  readonly collectionsMap = computed(() => {
    return this.collections().reduce((acc, collection) => {
      acc[collection.handle] = collection;
      return acc;
    }, {} as Record<string, HttpTypes.StoreCollection>);
  });

  readonly pageTitle = computed(() => {
    const filters = this.currentFilters();
    const typesMap = this.productTypesMap();
    const collectionsMap = this.collectionsMap();
    
    if (filters.productType) {
      return filters.productType;
    }

    if (filters.collection) {
      const collection = collectionsMap[filters.collection];
      return collection?.title || 'Collection';
    }
    
    if (filters.search) {
      return `Search results for "${filters.search}"`;
    }
    return 'All Products';
  });

  readonly pageDescription = computed(() => {
    const filters = this.currentFilters();
    const collectionsMap = this.collectionsMap();
    
    if (filters.collection) {
      const collection = collectionsMap[filters.collection];
      return collection?.metadata?.['description'] as string || null;
    }
    return null;
  });

  // Private state
  private currentPage = 1;

  constructor() {
    // Effects
    effect(() => {
      this.loadFilters();
    });

    effect(() => {
      const params = this.queryParams();
      const filters: FilterState = {
        productType: params['type'] || '',
        collection: params['collection'] || '',
        search: params['q'] || ''
      };
      this.currentFilters.set(filters);
      this.loadProducts();
    });
  }

  // Public methods
  onFiltersChanged(filters: FilterState): void {
    this.currentFilters.set(filters);
    this.loadProducts();
  }

  async loadMoreProducts(): Promise<void> {
    if (!this.hasMoreProducts() || this.isLoadingMore()) return;
    
    this.currentPage++;
    await this.loadProducts(false);
  }

  retryLoadProducts(): void {
    this.loadProducts();
  }

  // Private methods
  private async loadFilters(): Promise<void> {
    try {
      const [productTypesResponse, _] = await Promise.all([
        this.productTypesService.loadProductTypes({ limit: 50 }),
        this.collectionsService.loadCollections({ limit: 50 })
      ]);

      this.productTypes.set(productTypesResponse.productTypes);
      this.collections.set(this.collectionsService.collections());
    } catch (error) {
      // Error loading filters
    }
  }

  async loadProducts(reset: boolean = true): Promise<void> {
    try {
      if (reset) {
        this.isLoading.set(true);
        this.currentPage = 1;
        this.products.set([]);
      } else {
        this.isLoadingMore.set(true);
      }
      
      this.error.set(null);

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

      const filters = this.currentFilters();

      if (filters.productType) {
        const selectedTypeObj = this.productTypes().find(t => t.value === filters.productType);
        if (selectedTypeObj) {
          params.type_id = [selectedTypeObj.id];
        }
      }

      if (filters.collection) {
        const selectedCollectionObj = this.collections().find(c => c.handle === filters.collection);
        if (selectedCollectionObj) {
          params.collection_id = [selectedCollectionObj.id];
        }
      }

      if (filters.search?.trim()) {
        params.q = filters.search.trim();
      }

      const response = await this.productsService.loadProducts(params);
      
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
      this.error.set('Failed to load products. Please try again.');
    } finally {
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
    }
  }
} 