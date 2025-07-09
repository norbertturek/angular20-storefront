import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs';
import { MedusaService } from './medusa.service';
import { RegionsService } from './regions.service';

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

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private medusaService = inject(MedusaService);
  private regionsService = inject(RegionsService);

  private readonly searchEndpoint = 'http://localhost:7700';
  private readonly searchApiKey = 'yoursecretmasterkey';

  search(query: string): Observable<ProductSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    return this.searchProducts(query).pipe(
      switchMap(searchResults => this.enrichSearchResults(searchResults.hits)),
      catchError(error => {
        console.error('Search error:', error);
        return of([]);
      })
    );
  }

  private searchProducts(query: string): Observable<SearchResult> {
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

    return this.http.post<SearchResult>(url, body, { headers });
  }

  private enrichSearchResults(hits: SearchHit[]): Observable<ProductSearchResult[]> {
    if (!hits || hits.length === 0) {
      return of([]);
    }

    const productIds = hits.map(hit => hit.id);
    
    return this.regionsService.getRegionObservable().pipe(
      switchMap(currentRegion => {
        if (!currentRegion) {
          // Return hits without pricing if no region available
          return of(hits.map(hit => ({ ...hit, price: null })));
        }

        return this.getProductsById(productIds, currentRegion.id).pipe(
          switchMap(products => {
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
                    calculated_price: this.formatCurrency(amount, currencyCode),
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

            return of(enrichedResults);
          }),
          catchError(error => {
            console.error('Error enriching search results:', error);
            return of(hits.map(hit => ({ ...hit, price: null })));
          })
        );
      }),
      catchError(error => {
        console.error('Error getting region:', error);
        return of(hits.map(hit => ({ ...hit, price: null })));
      })
    );
  }

  private getProductsById(ids: string[], regionId: string): Observable<any[]> {
    const query = {
      id: ids.join(','),
      region_id: regionId,
      fields: '*variants.calculated_price,+variants.inventory_quantity'
    };

    return from(this.medusaService.fetch<{ products: any[] }>('/store/products', { query })).pipe(
      switchMap((response: { products: any[] }) => of(response.products || [])),
      catchError(error => {
        console.error('Error fetching products by ID:', error);
        return of([]);
      })
    );
  }

  private formatCurrency(amount: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  searchWithDebounce(query: string): Observable<ProductSearchResult[]> {
    return of(query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.search(q))
    );
  }
} 