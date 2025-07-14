import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { HttpTypes } from '@medusajs/types';

import { CartService } from '@services/cart.service';
import { RegionsService } from '@api/regions.service';
import { ToastService } from '@services/toast.service';

import { ProductsService } from '../products.service';

import { ProductCardComponent } from '@sharedComponents/product-card/product-card.component';
import { LoadingSpinnerComponent } from '@ui/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '@ui/button/button.component';
import { ProductImagesComponent } from './components/product-images/product-images.component';
import { ProductInfoComponent } from './components/product-info/product-info.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    ProductCardComponent, 
    ButtonComponent,
    ProductImagesComponent,
    ProductInfoComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly regionsService = inject(RegionsService);
  private readonly toastService = inject(ToastService);

  // State signals
  readonly product = signal<HttpTypes.StoreProduct | null>(null);
  readonly selectedVariant = signal<HttpTypes.StoreProductVariant | null>(null);
  readonly selectedImageUrl = signal<string>('');
  readonly quantity = signal<number>(1);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isAddingToCart = signal(false);
  readonly addToCartMessage = signal<string | null>(null);
  readonly addToCartSuccess = signal(false);
  readonly relatedProducts = signal<HttpTypes.StoreProduct[]>([]);
  readonly isLoadingRelated = signal(false);

  // Route signals
  readonly productParams = toSignal(this.route.params, { 
    initialValue: this.route.snapshot.params 
  });

  // Computed values
  readonly hasDiscountPrice = computed(() => {
    const variant = this.selectedVariant();
    if (!variant?.calculated_price) return false;
    
    const original = variant.calculated_price.original_amount;
    const calculated = variant.calculated_price.calculated_amount;
    
    return original && calculated && original > calculated;
  });

  readonly productImages = computed(() => {
    return this.product()?.images || [];
  });

  readonly productVariants = computed(() => {
    return this.product()?.variants || [];
  });

  readonly productTags = computed(() => {
    return this.product()?.tags || [];
  });

  constructor() {
    // Effects
    effect(() => {
      const params = this.productParams();
      const productHandle = params['handle'] || params['id'];
      if (productHandle) {
        this.loadProduct(productHandle);
      }
    });
  }

  // Public methods
  selectVariant(variant: HttpTypes.StoreProductVariant): void {
    if (this.isVariantAvailable(variant)) {
      this.selectedVariant.set(variant);
      this.quantity.set(1);
    }
  }

  selectImage(imageUrl: string): void {
    this.selectedImageUrl.set(imageUrl);
  }

  isVariantAvailable(variant: HttpTypes.StoreProductVariant): boolean {
    if (!variant.manage_inventory) {
      return true;
    }
    
    if (variant.inventory_quantity === null || variant.inventory_quantity === undefined) {
      return true;
    }
    
    return variant.inventory_quantity > 0;
  }

  getMaxQuantity(): number {
    const variant = this.selectedVariant();
    if (!variant) return 1;
    
    if (!variant.manage_inventory) {
      return 99;
    }
    
    if (variant.inventory_quantity === null || variant.inventory_quantity === undefined) {
      return 99;
    }
    
    return Math.max(1, variant.inventory_quantity);
  }

  async addToCart(): Promise<void> {
    const variant = this.selectedVariant();
    const prod = this.product();
    
    if (!variant || !prod) {
      return;
    }

    try {
      this.isAddingToCart.set(true);
      this.addToCartMessage.set(null);

      await this.cartService.addToCart({
        variant_id: variant.id,
        quantity: this.quantity()
      });

      this.addToCartMessage.set(`Added ${this.quantity()} ${prod.title} to cart`);
      this.addToCartSuccess.set(true);
      
      setTimeout(() => {
        this.addToCartMessage.set(null);
      }, 3000);

    } catch (error) {
      this.addToCartMessage.set('Failed to add item to cart. Please try again.');
      this.addToCartSuccess.set(false);
      
      setTimeout(() => {
        this.addToCartMessage.set(null);
      }, 5000);
    } finally {
      this.isAddingToCart.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
  
  getCollectionMetadata(key: string): string | null {
    const metadata = this.product()?.collection?.metadata;
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    
    const value = (metadata as any)[key];
    
    if (key.includes('image') && value && typeof value === 'object' && 'url' in value) {
      return value.url;
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    return null;
  }

  // Private methods
  private resetComponentState(): void {
    this.product.set(null);
    this.selectedVariant.set(null);
    this.selectedImageUrl.set('');
    this.quantity.set(1);
    this.error.set(null);
    this.addToCartMessage.set(null);
    this.addToCartSuccess.set(false);
    this.relatedProducts.set([]);
  }

  private async loadProduct(productHandle: string): Promise<void> {
    try {
      this.isLoading.set(true);
      this.resetComponentState();
      
      const regions = await this.regionsService.listRegions();
      const region = regions.length > 0 ? regions[0] : null;
      const regionId = region?.id;
      
      if (!regionId) {
        this.error.set('No region available. Please try again.');
        return;
      }
      
      let product = await this.productsService.loadProductByHandle(productHandle, regionId);
      
      if (!product) {
        product = await this.productsService.loadProductById(productHandle, regionId);
      }
      
      if (product) {
        this.product.set(product);
        
        const firstVariant = product.variants?.[0] || null;
        this.selectedVariant.set(firstVariant);
        
        this.selectedImageUrl.set(product.images?.[0]?.url || '');

        await this.loadRelatedProducts();
      } else {
        this.error.set('Product not found');
      }
    } catch (error) {
      this.error.set('Failed to load product. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  private async loadRelatedProducts(): Promise<void> {
    if (!this.product()?.collection?.id) {
      return;
    }
    
    try {
      this.isLoadingRelated.set(true);
      
      const regions = await this.regionsService.listRegions();
      const region = regions.length > 0 ? regions[0] : null;
      
      const { products } = await this.productsService.loadProducts({
        collection_id: [this.product()!.collection!.id],
        region_id: region?.id,
        limit: 3
      });
      
      const relatedProducts = products.filter((p: HttpTypes.StoreProduct) => p.id !== this.product()?.id);
      this.relatedProducts.set(relatedProducts);
      
    } catch (error) {
      // Error loading related products
    } finally {
      this.isLoadingRelated.set(false);
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
} 