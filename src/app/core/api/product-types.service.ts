import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';

export interface ProductTypeListParams {
  limit?: number;
  offset?: number;
  fields?: (keyof HttpTypes.StoreProductType)[];
  handle?: string;
}

export interface ProductTypeListResponse {
  productTypes: HttpTypes.StoreProductType[];
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ProductTypesService {
  private medusaService = inject(MedusaService);

  private productTypesState = signal<ProductTypeListResponse>({ productTypes: [], count: 0 });
  private currentProductTypeState = signal<HttpTypes.StoreProductType | null>(null);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);

  public productTypes = computed(() => this.productTypesState().productTypes);
  public count = computed(() => this.productTypesState().count);
  public currentProductType = computed(() => this.currentProductTypeState());
  public isLoading = computed(() => this.isLoadingState());
  public error = computed(() => this.errorState());

  async loadProductTypes(params: ProductTypeListParams = {}): Promise<ProductTypeListResponse> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);

      const query: any = {
        limit: params.limit || 100,
        offset: params.offset || 0
      };

      if (params.fields) {
        query.fields = params.fields.join(',');
      }

      if (params.handle) {
        query.handle = params.handle;
      }

      const response = await this.medusaService.fetch<{
        product_types: HttpTypes.StoreProductType[];
        count: number;
      }>('/store/custom/product-types', { query });

      const result = {
        productTypes: response.product_types,
        count: response.count
      };

      this.productTypesState.set(result);
      return result;
    } catch (error) {
      // Return fallback data if the custom endpoint is not available
      const fallbackResult = {
        productTypes: [
          { 
            id: '1', 
            value: 'Sofas',
            metadata: {
              image: {
                url: '/images/content/gray-three-seater-sofa.png'
              }
            }
          },
          { 
            id: '2', 
            value: 'Chairs',
            metadata: {
              image: {
                url: '/images/content/gray-arm-chair.png'
              }
            }
          },
          { 
            id: '3', 
            value: 'Tables',
            metadata: {
              image: {
                url: '/images/content/gray-backrest-sofa-wooden-coffee-table.png'
              }
            }
          },
          { 
            id: '4', 
            value: 'Storage',
            metadata: {
              image: {
                url: '/images/content/gray-one-seater-sofa-wooden-coffee-table.png'
              }
            }
          }
        ] as unknown as HttpTypes.StoreProductType[],
        count: 4
      };

      this.productTypesState.set(fallbackResult);
      return fallbackResult;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadProductTypeByHandle(handle: string): Promise<HttpTypes.StoreProductType | null> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);

      const response = await this.loadProductTypes({ handle, limit: 1 });
      const productType = response.productTypes[0] || null;
      
      this.currentProductTypeState.set(productType);
      return productType;
    } catch (error) {
      this.errorState.set('Failed to load product type');
      this.currentProductTypeState.set(null);
      return null;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  getProductTypeImageUrl(productType: HttpTypes.StoreProductType): string | null {
    if (typeof productType.metadata?.['image'] === 'object' &&
        productType.metadata['image'] &&
        'url' in productType.metadata['image'] &&
        typeof productType.metadata['image']['url'] === 'string') {
      return productType.metadata['image']['url'];
    }
    return null;
  }

  hasProductTypeImage(productType: HttpTypes.StoreProductType): boolean {
    return Boolean(this.getProductTypeImageUrl(productType));
  }
} 