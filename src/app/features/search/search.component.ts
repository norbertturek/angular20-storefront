import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ProductSearchResult, SearchService } from './search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  // State signals
  readonly searchQuery = signal('');
  readonly searchResults = signal<ProductSearchResult[]>([]);
  readonly isLoading = signal(false);

  // Route signals
  readonly queryParams = toSignal(this.route.queryParams, { 
    initialValue: this.route.snapshot.queryParams 
  });

  // Computed values
  readonly initialQuery = computed(() => {
    const params = this.queryParams();
    return params['q'] || '';
  });

  readonly searchInfo = computed(() => {
    const query = this.searchQuery();
    const results = this.searchResults();
    const loading = this.isLoading();
    
    if (!query || query.length === 0) return '';
    if (loading) return `Searching for "${query}"...`;
    return `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`;
  });

  readonly formattedResults = computed(() => {
    return this.searchResults().map(result => ({
      ...result,
      formattedPrice: result.price?.calculated_price || null
    }));
  });

  // Private state
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Effects
    effect(() => {
      const initialQuery = this.initialQuery();
      const currentQuery = this.searchQuery();
      
      if (initialQuery && currentQuery === '') {
        this.searchQuery.set(initialQuery);
        this.performSearch();
      }
    });
  }

  // Public methods
  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.updateUrl();
    }, 300);
  }

  onSearchButtonClick(): void {
    this.performSearch();
  }

  onSearchEnter(): void {
    this.performSearch();
  }

  async performSearch(): Promise<void> {
    if (!this.searchQuery() || this.searchQuery().trim().length === 0) {
      this.searchResults.set([]);
      return;
    }

    try {
      this.isLoading.set(true);
      this.updateUrl();

      const results = await this.searchService.search(this.searchQuery());
      this.searchResults.set(results);
    } catch (error) {
      this.searchResults.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Private methods
  private updateUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery() || null },
      queryParamsHandling: 'merge'
    });
  }
} 