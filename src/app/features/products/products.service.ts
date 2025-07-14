import { computed, signal, Injectable } from '@angular/core';

import { MedusaService } from '@api/medusa.service';
import { RegionsService } from '@api/regions.service';

import { HttpTypes } from '@medusajs/types';

export interface ProductListParams {
  limit?: number;
  offset?: number;
  q?: string;
  category_id?: string[];
  collection_id?: string[];
  type_id?: string[];
  region_id?: string;
  handle?: string;
  id?: string | string[];
}

export interface ProductListResponse {
  products: HttpTypes.StoreProduct[];
  count: number;
  nextPage?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(
    private medusaService: MedusaService,
    private regionsService: RegionsService
  ) {}

  // Signal-based state
  private productsState = signal<ProductListResponse>({ products: [], count: 0 });
  private currentProductState = signal<HttpTypes.StoreProduct | null>(null);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);

  // Public signals
  products = computed(() => this.productsState().products);
  count = computed(() => this.productsState().count);
  nextPage = computed(() => this.productsState().nextPage);
  currentProduct = computed(() => this.currentProductState());
  isLoading = computed(() => this.isLoadingState());
  error = computed(() => this.errorState());

  async loadProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);

      const query: any = {
        fields: '*variants.calculated_price',
        limit: params.limit || 12,
        offset: params.offset || 0,
        ...params
      };

      const response = await this.medusaService.fetch<{
        products: HttpTypes.StoreProduct[];
        count: number;
      }>('/store/products', { query });

      const nextPage = response.count > (query.offset + query.limit) 
        ? Math.floor(query.offset / query.limit) + 2 
        : null;

      const result = {
        products: response.products,
        count: response.count,
        nextPage
      };

      this.productsState.set(result);
      return result;
    } catch (error) {
      console.error('Error fetching products:', error);
      this.errorState.set('Failed to load products');
      const result = { products: [], count: 0 };
      this.productsState.set(result);
      return result;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadProductByHandle(handle: string, regionId?: string): Promise<HttpTypes.StoreProduct | null> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);

      const query: any = {
        handle,
        fields: '*variants.calculated_price,+variants.inventory_quantity'
      };

      if (regionId) {
        query.region_id = regionId;
      }

      const response = await this.medusaService.fetch<{
        products: HttpTypes.StoreProduct[];
      }>('/store/products', { query });

      const product = response.products[0] || null;
      this.currentProductState.set(product);
      return product;
    } catch (error) {
      console.error('Error fetching product by handle:', error);
      this.errorState.set('Failed to load product');
      this.currentProductState.set(null);
      return null;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadProductById(id: string, regionId?: string): Promise<HttpTypes.StoreProduct | null> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);

      const query: any = {
        fields: '*variants.calculated_price,+variants.inventory_quantity'
      };

      if (regionId) {
        query.region_id = regionId;
      }

      const response = await this.medusaService.fetch<{
        product: HttpTypes.StoreProduct;
      }>(`/store/products/${id}`, { query });

      this.currentProductState.set(response.product);
      return response.product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      this.errorState.set('Failed to load product');
      this.currentProductState.set(null);
      return null;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadProductsByIds(ids: string[], regionId?: string): Promise<HttpTypes.StoreProduct[]> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);

      const query: any = {
        id: ids,
        fields: '*variants.calculated_price,+variants.inventory_quantity'
      };

      if (regionId) {
        query.region_id = regionId;
      }

      const response = await this.medusaService.fetch<{
        products: HttpTypes.StoreProduct[];
      }>('/store/products', { query });

      this.productsState.set({
        products: response.products,
        count: response.products.length
      });

      return response.products;
    } catch (error) {
      console.error('Error fetching products by IDs:', error);
      this.errorState.set('Failed to load products');
      this.productsState.set({ products: [], count: 0 });
      return [];
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async searchProducts(searchQuery: string, params: ProductListParams = {}): Promise<ProductListResponse> {
    return this.loadProducts({
      ...params,
      q: searchQuery
    });
  }

  // Helper method to get product image URL
  getProductImageUrl(product: HttpTypes.StoreProduct, index: number = 0): string | null {
    if (!product.images || product.images.length === 0) {
      return null;
    }

    const image = product.images[index];
    return image?.url || null;
  }

  // Helper method to get product thumbnail
  getProductThumbnail(product: HttpTypes.StoreProduct): string | null {
    return product.thumbnail || this.getProductImageUrl(product, 0);
  }

  // Helper method to check if product has images
  hasProductImages(product: HttpTypes.StoreProduct): boolean {
    return Boolean(product.images && product.images.filter(img => Boolean(img.url)).length > 0);
  }

  // Helper method to get all valid product images
  getProductImages(product: HttpTypes.StoreProduct): HttpTypes.StoreProductImage[] {
    if (!product.images) return [];
    return product.images.filter(image => Boolean(image.url));
  }
} 