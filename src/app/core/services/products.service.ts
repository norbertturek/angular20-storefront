import { Injectable } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';
import { RegionsService } from './regions.service';
import { Observable, from } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  constructor(
    private medusaService: MedusaService,
    private regionsService: RegionsService
  ) {}

  async getProductsList(params: ProductListParams = {}): Promise<ProductListResponse> {
    try {
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

      return {
        products: response.products,
        count: response.count,
        nextPage
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [], count: 0 };
    }
  }

  getProducts(params?: ProductListParams): Observable<ProductListResponse> {
    return from(this.getProductsList(params));
  }

  async getProductByHandle(handle: string, regionId?: string): Promise<HttpTypes.StoreProduct | null> {
    try {
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

      return response.products[0] || null;
    } catch (error) {
      console.error('Error fetching product by handle:', error);
      return null;
    }
  }

  getProductByHandleObservable(handle: string, regionId?: string): Observable<HttpTypes.StoreProduct | null> {
    return from(this.getProductByHandle(handle, regionId));
  }

  async getProductById(id: string, regionId?: string): Promise<HttpTypes.StoreProduct | null> {
    try {
      const query: any = {
        fields: '*variants.calculated_price,+variants.inventory_quantity'
      };

      if (regionId) {
        query.region_id = regionId;
      }

      const response = await this.medusaService.fetch<{
        product: HttpTypes.StoreProduct;
      }>(`/store/products/${id}`, { query });

      return response.product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  }

  async getProductsByIds(ids: string[], regionId?: string): Promise<HttpTypes.StoreProduct[]> {
    try {
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

      return response.products;
    } catch (error) {
      console.error('Error fetching products by IDs:', error);
      return [];
    }
  }

  async searchProducts(searchQuery: string, params: ProductListParams = {}): Promise<ProductListResponse> {
    return this.getProductsList({
      ...params,
      q: searchQuery
    });
  }

  searchProductsObservable(query: string, params?: ProductListParams): Observable<ProductListResponse> {
    return from(this.searchProducts(query, params));
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