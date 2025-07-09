import { Injectable } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';
import { Observable, from } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ProductTypesService {
  constructor(private medusaService: MedusaService) {}

  async getProductTypesList(params: ProductTypeListParams = {}): Promise<ProductTypeListResponse> {
    try {
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

      return {
        productTypes: response.product_types,
        count: response.count
      };
    } catch (error) {
      console.error('Error fetching product types:', error);
      // Return fallback data if the custom endpoint is not available
      return {
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
    }
  }

  getProductTypes(params?: ProductTypeListParams): Observable<ProductTypeListResponse> {
    return from(this.getProductTypesList(params));
  }

  async getProductTypeByHandle(handle: string): Promise<HttpTypes.StoreProductType | null> {
    try {
      const response = await this.getProductTypesList({ handle, limit: 1 });
      return response.productTypes[0] || null;
    } catch (error) {
      console.error('Error fetching product type by handle:', error);
      return null;
    }
  }

  getProductTypeByHandleObservable(handle: string): Observable<HttpTypes.StoreProductType | null> {
    return from(this.getProductTypeByHandle(handle));
  }

  // Helper method to get product type image URL
  getProductTypeImageUrl(productType: HttpTypes.StoreProductType): string | null {
    if (typeof productType.metadata?.['image'] === 'object' &&
        productType.metadata['image'] &&
        'url' in productType.metadata['image'] &&
        typeof productType.metadata['image']['url'] === 'string') {
      return productType.metadata['image']['url'];
    }
    return null;
  }

  // Helper method to check if product type has image
  hasProductTypeImage(productType: HttpTypes.StoreProductType): boolean {
    return Boolean(this.getProductTypeImageUrl(productType));
  }
} 