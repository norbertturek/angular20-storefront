import { Injectable } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';
import { ProductsService } from './products.service';
import { Observable, from } from 'rxjs';

export interface CollectionListParams {
  limit?: number;
  offset?: number;
  fields?: (keyof HttpTypes.StoreCollection)[];
  handle?: string;
}

export interface CollectionListResponse {
  collections: HttpTypes.StoreCollection[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  constructor(
    private medusaService: MedusaService,
    private productsService: ProductsService
  ) {}

  async getCollectionsList(params: CollectionListParams = {}): Promise<CollectionListResponse> {
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
        query.limit = 1;
      }

      const response = await this.medusaService.fetch<{
        collections: HttpTypes.StoreCollection[];
        count: number;
      }>('/store/collections', { query });

      return {
        collections: response.collections,
        count: response.count || response.collections.length
      };
    } catch (error) {
      console.error('Error fetching collections:', error);
      return { collections: [], count: 0 };
    }
  }

  getCollections(params?: CollectionListParams): Observable<CollectionListResponse> {
    return from(this.getCollectionsList(params));
  }

  async retrieveCollection(id: string): Promise<HttpTypes.StoreCollection | null> {
    try {
      const response = await this.medusaService.fetch<{
        collection: HttpTypes.StoreCollection;
      }>(`/store/collections/${id}`);

      return response.collection;
    } catch (error) {
      console.error('Error retrieving collection:', error);
      return null;
    }
  }

  retrieveCollectionObservable(id: string): Observable<HttpTypes.StoreCollection | null> {
    return from(this.retrieveCollection(id));
  }

  async getCollectionByHandle(handle: string, fields?: (keyof HttpTypes.StoreCollection)[]): Promise<HttpTypes.StoreCollection | null> {
    try {
      const response = await this.getCollectionsList({ handle, fields });
      return response.collections[0] || null;
    } catch (error) {
      console.error('Error fetching collection by handle:', error);
      return null;
    }
  }

  getCollectionByHandleObservable(handle: string, fields?: (keyof HttpTypes.StoreCollection)[]): Observable<HttpTypes.StoreCollection | null> {
    return from(this.getCollectionByHandle(handle, fields));
  }

  async getCollectionsWithProducts(countryCode?: string): Promise<HttpTypes.StoreCollection[]> {
    try {
      const { collections } = await this.getCollectionsList({ limit: 3 });

      if (!collections || collections.length === 0) {
        return [];
      }

      const collectionIds = collections
        .map(collection => collection.id)
        .filter(Boolean) as string[];

      const { products } = await this.productsService.getProductsList({
        collection_id: collectionIds,
        limit: 50
      });

      // Group products by collection
      products.forEach(product => {
        const collection = collections.find(
          collection => collection.id === product.collection_id
        );

        if (collection) {
          if (!collection.products) {
            collection.products = [];
          }
          collection.products.push(product);
        }
      });

      return collections;
    } catch (error) {
      console.error('Error fetching collections with products:', error);
      return [];
    }
  }

  getCollectionsWithProductsObservable(countryCode?: string): Observable<HttpTypes.StoreCollection[]> {
    return from(this.getCollectionsWithProducts(countryCode));
  }

  // Helper method to get collection image URL
  getCollectionImageUrl(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['image'] === 'object' &&
        collection.metadata['image'] &&
        'url' in collection.metadata['image'] &&
        typeof collection.metadata['image']['url'] === 'string') {
      return collection.metadata['image']['url'];
    }
    return null;
  }

  // Helper method to check if collection has image
  hasCollectionImage(collection: HttpTypes.StoreCollection): boolean {
    return Boolean(this.getCollectionImageUrl(collection));
  }

  // Helper method to get collection product page image
  getCollectionProductPageImage(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['product_page_image'] === 'object' &&
        collection.metadata['product_page_image'] &&
        'url' in collection.metadata['product_page_image'] &&
        typeof collection.metadata['product_page_image']['url'] === 'string') {
      return collection.metadata['product_page_image']['url'];
    }
    return null;
  }

  // Helper method to get collection wide image
  getCollectionWideImage(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['product_page_wide_image'] === 'object' &&
        collection.metadata['product_page_wide_image'] &&
        'url' in collection.metadata['product_page_wide_image'] &&
        typeof collection.metadata['product_page_wide_image']['url'] === 'string') {
      return collection.metadata['product_page_wide_image']['url'];
    }
    return null;
  }
} 