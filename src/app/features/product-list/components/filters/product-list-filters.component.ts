import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpTypes } from '@medusajs/types';

export interface FilterState {
  productType: string;
  collection: string;
  search: string;
}

@Component({
  selector: 'app-product-list-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-container sticky top-0 bg-primary border-b border-primary py-3 mb-6 shadow-sm w-full" style="top: 70px; z-index: 100;">
      <div class="container">
        <form class="filters-form w-full" (ngSubmit)="applyFilters()">
        <div class="filters-grid grid grid-cols-3 gap-4 items-center">
          <div class="filter-group flex flex-col">
            <select 
              id="productType" 
              [(ngModel)]="productType" 
              name="productType"
              class="filter-select p-2 px-3 border border-secondary rounded-lg text-sm bg-primary transition-all duration-200 h-10"
              placeholder="Product Type"
              (change)="onFilterChange()"
            >
              <option value="">All Types</option>
              @for (type of productTypes(); track type.id) {
                <option [value]="type.value">{{ type.value }}</option>
              }
            </select>
          </div>

          <div class="filter-group flex flex-col">
            <select 
              id="collection" 
              [(ngModel)]="collection" 
              name="collection"
              class="filter-select p-2 px-3 border border-secondary rounded-lg text-sm bg-primary transition-all duration-200 h-10"
              placeholder="Collection"
              (change)="onFilterChange()"
            >
              <option value="">All Collections</option>
              @for (collection of collections(); track collection.id) {
                <option [value]="collection.handle">{{ collection.title }}</option>
              }
            </select>
          </div>

          <div class="filter-group flex flex-col">
            <div class="search-input-wrapper relative flex items-center">
              <input 
                type="text" 
                id="search" 
                [(ngModel)]="search"
                name="search"
                placeholder="Search products..."
                class="filter-input p-2 px-3 border border-secondary rounded-lg text-sm bg-primary transition-all duration-200 h-10 pr-12 w-full"
                (input)="onSearchInput()"
              />
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </form>
      </div>
    </div>
  `,
  styles: [`
    /* Custom styles only for what's not available in utility classes */
    .search-icon {
      position: absolute;
      right: 1rem;
      width: 16px;
      height: 16px;
      color: #9ca3af;
      z-index: 1;
    }

    .filter-select:focus,
    .filter-input:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }

    /* Responsive grid adjustments */
    @media (max-width: 768px) {
      .filters-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      
      .filters-container {
        top: 60px;
        padding: 0.5rem 0;
      }
      
      .filters-form {
        /* Padding now handled by container */
      }
    }
    
    @media (max-width: 640px) {
      .filters-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListFiltersComponent {
  // Inputs
  productTypes = input<HttpTypes.StoreProductType[]>([]);
  collections = input<HttpTypes.StoreCollection[]>([]);
  initialFilters = input<FilterState>({ productType: '', collection: '', search: '' });

  // Outputs
  filtersChanged = output<FilterState>();

  // Internal state
  productType = signal('');
  collection = signal('');
  search = signal('');

  // Computed
  hasActiveFilters = computed(() => {
    return this.productType() !== '' || this.collection() !== '' || this.search() !== '';
  });

  private searchTimeout: any;

  // Initialize with input values using effect
  initEffect = effect(() => {
    const initial = this.initialFilters();
    this.productType.set(initial.productType);
    this.collection.set(initial.collection);
    this.search.set(initial.search);
  });

  onFilterChange() {
    this.emitFilters();
  }

  onSearchInput() {
    // Debounce search input
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.emitFilters();
    }, 300);
  }

  applyFilters() {
    this.emitFilters();
  }

  private emitFilters() {
    const filters: FilterState = {
      productType: this.productType(),
      collection: this.collection(),
      search: this.search()
    };
    
    this.filtersChanged.emit(filters);
  }
} 