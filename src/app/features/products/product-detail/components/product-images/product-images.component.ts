import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpTypes } from '@medusajs/types';

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

@Component({
  selector: 'app-product-images',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-images">
      <div class="main-image">
        <img 
          [src]="selectedImageUrl()" 
          [alt]="productTitle()"
          class="product-image"
        />
      </div>
      
      @if (productImages().length > 1) {
        <div class="image-thumbnails">
          @for (image of productImages(); track image.id) {
            <img 
              [src]="image.url" 
              [alt]="productTitle()"
              class="thumbnail"
              [class.active]="selectedImageUrl() === image.url"
              (click)="selectImage(image.url)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .product-images {
      flex: 1;
      max-width: 500px;
    }

    .main-image {
      margin-bottom: 1rem;
      border-radius: 8px;
      overflow: hidden;
      background-color: #f8f9fa;
    }

    .product-image {
      width: 100%;
      height: 400px;
      object-fit: cover;
      display: block;
    }

    .image-thumbnails {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .thumbnail {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s ease;
    }

    .thumbnail:hover {
      border-color: #e5e7eb;
    }

    .thumbnail.active {
      border-color: #3b82f6;
    }

    @media (max-width: 768px) {
      .product-images {
        max-width: 100%;
      }

      .product-image {
        height: 300px;
      }

      .thumbnail {
        width: 60px;
        height: 60px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductImagesComponent {
  // Inputs
  images = input<ProductImage[]>([]);
  productTitle = input<string>('');

  // Outputs
  imageSelected = output<string>();

  // Internal state
  selectedImageUrl = signal<string>('');

  // Computed
  productImages = computed(() => this.images());

  // Initialize with first image
  initEffect = effect(() => {
    const images = this.images();
    if (images.length > 0 && !this.selectedImageUrl()) {
      this.selectedImageUrl.set(images[0].url);
    }
  });

  selectImage(imageUrl: string) {
    this.selectedImageUrl.set(imageUrl);
    this.imageSelected.emit(imageUrl);
  }
} 