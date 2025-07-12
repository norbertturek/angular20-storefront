import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpTypes } from '@medusajs/types';
import { ProductTypesService } from '@core/services/product-types.service';
import { CollectionsService } from '@core/services/collections.service';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private productTypesService = inject(ProductTypesService);
  private collectionsService = inject(CollectionsService);

  productTypes = signal<HttpTypes.StoreProductType[]>([]);
  collections = signal<HttpTypes.StoreCollection[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Load product types and collections in parallel
      const [productTypesResponse, collectionsResponse] = await Promise.all([
        this.productTypesService.getProductTypesList({ 
          limit: 20,
          fields: ['id', 'value', 'metadata']
        }),
        this.collectionsService.getCollectionsWithProducts()
      ]);

      this.productTypes.set(productTypesResponse.productTypes);
      this.collections.set(collectionsResponse);
      
    } catch (error) {
      console.error('Error loading home data:', error);
      this.error.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getProductTypeImageUrl(productType: HttpTypes.StoreProductType): string | null {
    return this.productTypesService.getProductTypeImageUrl(productType);
  }

  hasProductTypeImage(productType: HttpTypes.StoreProductType): boolean {
    return this.productTypesService.hasProductTypeImage(productType);
  }

  getCollectionImageUrl(collection: HttpTypes.StoreCollection): string | null {
    return this.collectionsService.getCollectionImageUrl(collection);
  }

  hasCollectionImage(collection: HttpTypes.StoreCollection): boolean {
    return this.collectionsService.hasCollectionImage(collection);
  }

  getCollectionProducts(collection: HttpTypes.StoreCollection): HttpTypes.StoreProduct[] {
    return collection.products || [];
  }
} 