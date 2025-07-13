import { inject, signal, computed } from '@angular/core';
import { injectMedusaService } from '@api/medusa.service';
import { injectRegionsService } from '@api/regions.service';

export interface SearchHit {
  id: string;
  handle: string;
  title: string;
  thumbnail: string;
  variants: string[];
}

export interface SearchResult {
  hits: SearchHit[];
  processingTimeMs: number;
  query: string;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

export interface ProductSearchResult extends SearchHit {
  price?: {
    calculated_price_number: number;
    calculated_price: string;
    original_price_number: number | null;
    original_price: string;
    currency_code: string | null;
    price_type: string | null;
    percentage_diff: string;
  } | null;
  product?: any;
}

export class SearchService {
  private medusaService = injectMedusaService();
  private regionsService = injectRegionsService();

  private readonly searchEndpoint = 'http://localhost:7700';
  private readonly searchApiKey = 'yoursecretmasterkey';

  // Signal-based state
  private searchResultsState = signal<ProductSearchResult[]>([]);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);
  private searchQueryState = signal<string>('');

  // Public signals
  searchResults = computed(() => this.searchResultsState());
  isLoading = computed(() => this.isLoadingState());
  error = computed(() => this.errorState());
  searchQuery = computed(() => this.searchQueryState());

  async search(query: string): Promise<ProductSearchResult[]> {
    if (!query || query.trim().length === 0) {
      this.searchResultsState.set([]);
      return [];
    }

    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      this.searchQueryState.set(query);

      const searchResults = await this.searchProducts(query);
      const enrichedResults = await this.enrichSearchResults(searchResults.hits);
      
      this.searchResultsState.set(enrichedResults);
      return enrichedResults;
    } catch (error) {
      console.error('Search error:', error);
      this.errorState.set('Search failed');
      this.searchResultsState.set([]);
      return [];
    } finally {
      this.isLoadingState.set(false);
    }
  }

  private async searchProducts(query: string): Promise<SearchResult> {
    const url = `${this.searchEndpoint}/indexes/products/search`;
    
    const body = {
      q: query,
      limit: 10,
      offset: 0
    };

    const headers = {
      'Authorization': `Bearer ${this.searchApiKey}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    return response.json();
  }

  private async enrichSearchResults(hits: SearchHit[]): Promise<ProductSearchResult[]> {
    if (!hits || hits.length === 0) {
      return [];
    }

    const productIds = hits.map(hit => hit.id);
    const currentRegion = await this.regionsService.loadRegionByCountry();
    
    if (!currentRegion) {
      // Return hits without pricing if no region available
      return hits.map(hit => ({ ...hit, price: null }));
    }

    try {
      const products = await this.getProductsById(productIds, currentRegion.id);
      
      const enrichedResults = hits.map(hit => {
        const product = products.find((p: any) => p.id === hit.id);
        
        let price = null;
        if (product && product.variants && product.variants.length > 0) {
          // Find the cheapest variant
          const cheapestVariant = product.variants.reduce((cheapest: any, variant: any) => {
            const currentPrice = variant.calculated_price?.calculated_amount || Infinity;
            const cheapestPrice = cheapest.calculated_price?.calculated_amount || Infinity;
            return currentPrice < cheapestPrice ? variant : cheapest;
          });

          if (cheapestVariant.calculated_price) {
            const amount = cheapestVariant.calculated_price.calculated_amount;
            const currencyCode = cheapestVariant.calculated_price.currency_code;
            
            price = {
              calculated_price_number: amount,
              calculated_price: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode || 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(amount),
              original_price_number: null,
              original_price: '',
              currency_code: currencyCode,
              price_type: null,
              percentage_diff: ''
            };
          }
        }

        return {
          ...hit,
          price,
          product
        };
      });

      return enrichedResults;
    } catch (error) {
      console.error('Error enriching search results:', error);
      return hits.map(hit => ({ ...hit, price: null }));
    }
  }

  private async getProductsById(ids: string[], regionId: string): Promise<any[]> {
    try {
      const query = {
        id: ids.join(','),
        region_id: regionId,
        fields: '*variants.calculated_price,+variants.inventory_quantity'
      };

      const response = await this.medusaService.fetch<{ products: any[] }>('/store/products', { query });
      return response.products || [];
    } catch (error) {
      console.error('Error fetching products by ID:', error);
      return [];
    }
  }

  async searchWithDebounce(query: string): Promise<ProductSearchResult[]> {
    // Simple debounce implementation
    return new Promise((resolve) => {
      setTimeout(async () => {
        const results = await this.search(query);
        resolve(results);
      }, 300);
    });
  }
} 