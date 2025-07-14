import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from '@api/medusa.service';
import { ProductsService } from '@features/products/products.service';

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

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private medusaService = inject(MedusaService);
  private productsService = inject(ProductsService);

  private collectionsState = signal<CollectionListResponse>({ collections: [], count: 0 });
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);

  public collections = computed(() => this.collectionsState().collections);
  public count = computed(() => this.collectionsState().count);
  public isLoading = computed(() => this.isLoadingState());
  public error = computed(() => this.errorState());

  async loadCollections(params: CollectionListParams = {}) {
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
        query.limit = 1;
      }
      const response = await this.medusaService.fetch<{
        collections: HttpTypes.StoreCollection[];
        count: number;
      }>('/store/collections', { query });
      this.collectionsState.set({
        collections: response.collections,
        count: response.count || response.collections.length
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
      this.errorState.set('Failed to load collections');
      this.collectionsState.set({ collections: [], count: 0 });
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadCollection(id: string) {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      const response = await this.medusaService.fetch<{
        collection: HttpTypes.StoreCollection;
      }>(`/store/collections/${id}`);
      this.collectionsState.set({
        collections: [response.collection],
        count: 1
      });
    } catch (error) {
      console.error('Error retrieving collection:', error);
      this.errorState.set('Failed to load collection');
      this.collectionsState.set({ collections: [], count: 0 });
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadCollectionByHandle(handle: string, fields?: (keyof HttpTypes.StoreCollection)[]) {
    await this.loadCollections({ handle, fields });
  }

  async loadCollectionsWithProducts(countryCode?: string) {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      await this.loadCollections({ limit: 3 });
      const currentCollections = this.collections();
      if (!currentCollections || currentCollections.length === 0) {
        return;
      }
      const collectionIds = currentCollections
        .map(collection => collection.id)
        .filter(Boolean) as string[];
      const productsResponse = await this.productsService.loadProducts({
        collection_id: collectionIds,
        limit: 50
      });
      productsResponse.products.forEach((product: HttpTypes.StoreProduct) => {
        const collection = currentCollections.find(
          collection => collection.id === product.collection_id
        );
        if (collection) {
          if (!collection.products) {
            collection.products = [];
          }
          collection.products.push(product);
        }
      });
      this.collectionsState.set({
        collections: currentCollections,
        count: currentCollections.length
      });
    } catch (error) {
      console.error('Error fetching collections with products:', error);
      this.errorState.set('Failed to load collections with products');
      this.collectionsState.set({ collections: [], count: 0 });
    } finally {
      this.isLoadingState.set(false);
    }
  }

  getCollectionImageUrl(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['image'] === 'object' &&
        collection.metadata['image'] &&
        'url' in collection.metadata['image'] &&
        typeof collection.metadata['image']['url'] === 'string') {
      return collection.metadata['image']['url'];
    }
    return null;
  }

  hasCollectionImage(collection: HttpTypes.StoreCollection): boolean {
    return Boolean(this.getCollectionImageUrl(collection));
  }

  getCollectionProductPageImage(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['product_page_image'] === 'object' &&
        collection.metadata['product_page_image'] &&
        'url' in collection.metadata['product_page_image'] &&
        typeof collection.metadata['product_page_image']['url'] === 'string') {
      return collection.metadata['product_page_image']['url'];
    }
    return null;
  }

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