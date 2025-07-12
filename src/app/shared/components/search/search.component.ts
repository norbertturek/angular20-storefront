import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductSearchResult, SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  private searchService = inject(SearchService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  
  searchQuery = '';
  isSearchActive = signal(false);
  searchResults = signal<ProductSearchResult[]>([]);
  isLoading = signal(false);
  
  constructor() {
    // Listen for search results with automatic cleanup
    this.searchService.searchWithDebounce(this.searchQuery).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
  }
  
  toggleSearch() {
    const newState = !this.isSearchActive();
    this.isSearchActive.set(newState);
    
    if (newState) {
      // Focus input after DOM update
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 100);
    } else {
      this.clearSearch();
    }
  }
  
  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    
    if (this.searchQuery.trim().length > 0) {
      this.isLoading.set(true);
      this.searchService.searchWithDebounce(this.searchQuery).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(results => {
        this.searchResults.set(results);
        this.isLoading.set(false);
      });
    } else {
      this.searchResults.set([]);
      this.isLoading.set(false);
    }
  }
  
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.clearSearch();
      this.isSearchActive.set(false);
    } else if (event.key === 'Enter' && this.searchQuery.trim().length > 0) {
      // Navigate to search results page
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.isSearchActive.set(false);
      this.clearSearch();
    }
  }
  
  onSearchFocus() {
    this.isSearchActive.set(true);
  }
  
  onResultClick() {
    this.isSearchActive.set(false);
    this.clearSearch();
  }
  
  private clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
    this.isLoading.set(false);
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-container');
    
    if (!searchContainer && this.isSearchActive()) {
      this.isSearchActive.set(false);
      this.clearSearch();
    }
  }
} 