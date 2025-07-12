import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService, ProductSearchResult } from '../../core/services/search.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private destroyRef = inject(DestroyRef);

  searchQuery = signal('');
  searchResults = signal<ProductSearchResult[]>([]);
  isLoading = signal(false);

  constructor() {
    // Get initial search query from URL with automatic cleanup
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const query = params['q'] || '';
      if (query !== this.searchQuery()) {
        this.searchQuery.set(query);
        if (query) {
          this.performSearch();
        }
      }
    });
  }

  onSearchInput() {
    // Update URL without triggering search
    this.updateUrl();
  }

  performSearch() {
    if (!this.searchQuery() || this.searchQuery().trim().length === 0) {
      this.searchResults.set([]);
      return;
    }

    this.isLoading.set(true);
    this.updateUrl();

    this.searchService.search(this.searchQuery()).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchResults.set([]);
        this.isLoading.set(false);
      }
    });
  }

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery() || null },
      queryParamsHandling: 'merge'
    });
  }
} 