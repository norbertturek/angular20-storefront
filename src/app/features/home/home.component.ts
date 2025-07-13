import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { injectProductTypesService } from '@api/product-types.service';
import { injectCollectionsService } from '@services/collections.service';

import { HttpTypes } from '@medusajs/types';

import { AboutPreviewComponent } from './components/about-preview/about-preview.component';
import { CollectionsComponent } from './components/collections/collections.component';
import { HeroComponent } from './components/hero/hero.component';
import { ProductTypesComponent } from './components/product-types/product-types.component';

import { ButtonComponent } from '@ui/button/button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    HeroComponent,
    ProductTypesComponent,
    CollectionsComponent,
    AboutPreviewComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  // Services
  private readonly productTypesService = injectProductTypesService();
  private readonly collectionsService = injectCollectionsService();

  // State signals
  readonly productTypes = signal<HttpTypes.StoreProductType[]>([]);
  readonly collections = signal<HttpTypes.StoreCollection[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly previewProducts = computed(() => {
    return this.collections().reduce((acc, collection) => {
      acc[collection.id] = (collection.products || []).slice(0, 3);
      return acc;
    }, {} as Record<string, HttpTypes.StoreProduct[]>);
  });

  constructor() {
    // Effects
    effect(() => {
      this.loadData();
    });
  }

  // Public methods
  retryLoadData(): void {
    this.loadData();
  }

  // Private methods
  private async loadData(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const [productTypesResponse, _] = await Promise.all([
        this.productTypesService.loadProductTypes({
          limit: 20,
          fields: ['id', 'value', 'metadata'],
        }),
        this.collectionsService.loadCollectionsWithProducts(),
      ]);

      this.productTypes.set(productTypesResponse.productTypes);
      this.collections.set(this.collectionsService.collections());
    } catch (error) {
      this.error.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
