import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ProductSearchResult, SearchService } from '@features/search/search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent {
  // View children
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  
  // Services
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  
  // State signals
  readonly query = signal('');
  readonly isSearchActive = signal(false);
  readonly searchResults = signal<ProductSearchResult[]>([]);
  readonly isLoading = signal(false);

  constructor() {
    // Effects
    effect(() => {
      const q = this.query();
      if (q.trim().length > 0) {
        this.performSearch(q);
      } else {
        this.searchResults.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // Public methods
  async performSearch(query: string): Promise<void> {
    try {
      this.isLoading.set(true);
      const results = await this.searchService.searchWithDebounce(query);
      this.searchResults.set(results);
    } catch (error) {
      this.searchResults.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleSearch(): void {
    const newState = !this.isSearchActive();
    this.isSearchActive.set(newState);
    
    if (newState) {
      setTimeout(() => {
        this.searchInput()?.nativeElement.focus();
      }, 100);
    } else {
      this.clearSearch();
    }
  }
  
  onKeyDown(event: KeyboardEvent): void {
    const q = this.query();
    if (event.key === 'Escape') {
      this.clearSearch();
      this.isSearchActive.set(false);
    } else if (event.key === 'Enter' && q.trim().length > 0) {
      this.router.navigate(['/search'], { queryParams: { q } });
      this.isSearchActive.set(false);
      this.clearSearch();
    }
  }
  
  onSearchFocus(): void {
    this.isSearchActive.set(true);
  }
  
  onResultClick(): void {
    this.isSearchActive.set(false);
    this.clearSearch();
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-container');
    
    if (!searchContainer && this.isSearchActive()) {
      this.isSearchActive.set(false);
      this.clearSearch();
    }
  }

  // Private methods
  private clearSearch(): void {
    this.query.set('');
    this.searchResults.set([]);
    this.isLoading.set(false);
  }
} 