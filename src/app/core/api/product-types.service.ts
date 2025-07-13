import { computed, signal } from '@angular/core';

import { HttpTypes } from '@medusajs/types';

import { injectMedusaService } from './medusa.service';

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

export interface ProductTypesService {
  productTypes: ReturnType<typeof computed<HttpTypes.StoreProductType[]>>;
  count: ReturnType<typeof computed<number>>;
  currentProductType: ReturnType<typeof computed<HttpTypes.StoreProductType | null>>;
  isLoading: ReturnType<typeof computed<boolean>>;
  error: ReturnType<typeof computed<string | null>>;
  loadProductTypes: (params?: ProductTypeListParams) => Promise<ProductTypeListResponse>;
  loadProductTypeByHandle: (handle: string) => Promise<HttpTypes.StoreProductType | null>;
  getProductTypeImageUrl: (productType: HttpTypes.StoreProductType) => string | null;
  hasProductTypeImage: (productType: HttpTypes.StoreProductType) => boolean;
}

export function injectProductTypesService(): ProductTypesService {
  const medusaService = injectMedusaService();

  // Signal-based state
  const productTypesState = signal<ProductTypeListResponse>({ productTypes: [], count: 0 });
  const currentProductTypeState = signal<HttpTypes.StoreProductType | null>(null);
  const isLoadingState = signal(false);
  const errorState = signal<string | null>(null);

  // Public signals
  const productTypes = computed(() => productTypesState().productTypes);
  const count = computed(() => productTypesState().count);
  const currentProductType = computed(() => currentProductTypeState());
  const isLoading = computed(() => isLoadingState());
  const error = computed(() => errorState());

  async function loadProductTypes(params: ProductTypeListParams = {}): Promise<ProductTypeListResponse> {
    try {
      isLoadingState.set(true);
      errorState.set(null);

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

      const response = await medusaService.fetch<{
        product_types: HttpTypes.StoreProductType[];
        count: number;
      }>('/store/custom/product-types', { query });

      const result = {
        productTypes: response.product_types,
        count: response.count
      };

      productTypesState.set(result);
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

      productTypesState.set(fallbackResult);
      return fallbackResult;
    } finally {
      isLoadingState.set(false);
    }
  }

  async function loadProductTypeByHandle(handle: string): Promise<HttpTypes.StoreProductType | null> {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      const response = await loadProductTypes({ handle, limit: 1 });
      const productType = response.productTypes[0] || null;
      
      currentProductTypeState.set(productType);
      return productType;
    } catch (error) {
      errorState.set('Failed to load product type');
      currentProductTypeState.set(null);
      return null;
    } finally {
      isLoadingState.set(false);
    }
  }

  // Helper method to get product type image URL
  function getProductTypeImageUrl(productType: HttpTypes.StoreProductType): string | null {
    if (typeof productType.metadata?.['image'] === 'object' &&
        productType.metadata['image'] &&
        'url' in productType.metadata['image'] &&
        typeof productType.metadata['image']['url'] === 'string') {
      return productType.metadata['image']['url'];
    }
    return null;
  }

  // Helper method to check if product type has image
  function hasProductTypeImage(productType: HttpTypes.StoreProductType): boolean {
    return Boolean(getProductTypeImageUrl(productType));
  }

  return {
    productTypes,
    count,
    currentProductType,
    isLoading,
    error,
    loadProductTypes,
    loadProductTypeByHandle,
    getProductTypeImageUrl,
    hasProductTypeImage
  };
} 