import { inject, signal, computed } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { injectMedusaService } from '@api/medusa.service';
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

export interface CollectionsService {
  collections: ReturnType<typeof computed<HttpTypes.StoreCollection[]>>;
  count: ReturnType<typeof computed<number>>;
  isLoading: ReturnType<typeof computed<boolean>>;
  error: ReturnType<typeof computed<string | null>>;
  loadCollections: (params?: CollectionListParams) => Promise<void>;
  loadCollection: (id: string) => Promise<void>;
  loadCollectionByHandle: (handle: string, fields?: (keyof HttpTypes.StoreCollection)[]) => Promise<void>;
  loadCollectionsWithProducts: (countryCode?: string) => Promise<void>;
  getCollectionImageUrl: (collection: HttpTypes.StoreCollection) => string | null;
  hasCollectionImage: (collection: HttpTypes.StoreCollection) => boolean;
  getCollectionProductPageImage: (collection: HttpTypes.StoreCollection) => string | null;
  getCollectionWideImage: (collection: HttpTypes.StoreCollection) => string | null;
}

export function injectCollectionsService(): CollectionsService {
  const medusaService = injectMedusaService();
  const productsService = inject(ProductsService);

  // Signal-based state
  const collectionsState = signal<CollectionListResponse>({ collections: [], count: 0 });
  const isLoadingState = signal(false);
  const errorState = signal<string | null>(null);

  // Public signals
  const collections = computed(() => collectionsState().collections);
  const count = computed(() => collectionsState().count);
  const isLoading = computed(() => isLoadingState());
  const error = computed(() => errorState());

  // Main method - returns signal with async data
  async function loadCollections(params: CollectionListParams = {}) {
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
        query.limit = 1;
      }

      const response = await medusaService.fetch<{
        collections: HttpTypes.StoreCollection[];
        count: number;
      }>('/store/collections', { query });

      collectionsState.set({
        collections: response.collections,
        count: response.count || response.collections.length
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
      errorState.set('Failed to load collections');
      collectionsState.set({ collections: [], count: 0 });
    } finally {
      isLoadingState.set(false);
    }
  }

  // Get single collection by ID
  async function loadCollection(id: string) {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      const response = await medusaService.fetch<{
        collection: HttpTypes.StoreCollection;
      }>(`/store/collections/${id}`);

      collectionsState.set({
        collections: [response.collection],
        count: 1
      });
    } catch (error) {
      console.error('Error retrieving collection:', error);
      errorState.set('Failed to load collection');
      collectionsState.set({ collections: [], count: 0 });
    } finally {
      isLoadingState.set(false);
    }
  }

  // Get collection by handle
  async function loadCollectionByHandle(handle: string, fields?: (keyof HttpTypes.StoreCollection)[]) {
    await loadCollections({ handle, fields });
  }

  // Get collections with products - signal-based approach
  async function loadCollectionsWithProducts(countryCode?: string) {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      // Load collections first
      await loadCollections({ limit: 3 });
      const currentCollections = collections();

      if (!currentCollections || currentCollections.length === 0) {
        return;
      }

      const collectionIds = currentCollections
        .map(collection => collection.id)
        .filter(Boolean) as string[];

      // Load products for these collections
      const productsResponse = await productsService.loadProducts({
        collection_id: collectionIds,
        limit: 50
      });

      // Group products by collection
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

      // Update state with enriched collections
      collectionsState.set({
        collections: currentCollections,
        count: currentCollections.length
      });
    } catch (error) {
      console.error('Error fetching collections with products:', error);
      errorState.set('Failed to load collections with products');
      collectionsState.set({ collections: [], count: 0 });
    } finally {
      isLoadingState.set(false);
    }
  }

  // Helper method to get collection image URL
  function getCollectionImageUrl(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['image'] === 'object' &&
        collection.metadata['image'] &&
        'url' in collection.metadata['image'] &&
        typeof collection.metadata['image']['url'] === 'string') {
      return collection.metadata['image']['url'];
    }
    return null;
  }

  // Helper method to check if collection has image
  function hasCollectionImage(collection: HttpTypes.StoreCollection): boolean {
    return Boolean(getCollectionImageUrl(collection));
  }

  // Helper method to get collection product page image
  function getCollectionProductPageImage(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['product_page_image'] === 'object' &&
        collection.metadata['product_page_image'] &&
        'url' in collection.metadata['product_page_image'] &&
        typeof collection.metadata['product_page_image']['url'] === 'string') {
      return collection.metadata['product_page_image']['url'];
    }
    return null;
  }

  // Helper method to get collection wide image
  function getCollectionWideImage(collection: HttpTypes.StoreCollection): string | null {
    if (typeof collection.metadata?.['product_page_wide_image'] === 'object' &&
        collection.metadata['product_page_wide_image'] &&
        'url' in collection.metadata['product_page_wide_image'] &&
        typeof collection.metadata['product_page_wide_image']['url'] === 'string') {
      return collection.metadata['product_page_wide_image']['url'];
    }
    return null;
  }

  return {
    collections,
    count,
    isLoading,
    error,
    loadCollections,
    loadCollection,
    loadCollectionByHandle,
    loadCollectionsWithProducts,
    getCollectionImageUrl,
    hasCollectionImage,
    getCollectionProductPageImage,
    getCollectionWideImage
  };
} 