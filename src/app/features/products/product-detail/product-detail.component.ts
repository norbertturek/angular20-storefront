import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpTypes } from '@medusajs/types';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegionsService } from '../../../core/services/regions.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductCardComponent],
  template: `
    <div class="product-detail-container">
      @if (!isLoading() && product()) {
        <div class="product-detail">
          <div class="product-images">
            <div class="main-image">
              <img 
                [src]="selectedImageUrl()" 
                [alt]="product()?.title"
                class="product-image"
              />
            </div>
            
            @if (productImages().length > 1) {
              <div class="image-thumbnails">
                @for (image of productImages(); track image.id) {
                  <img 
                    [src]="image.url" 
                    [alt]="product()?.title"
                    class="thumbnail"
                    [class.active]="selectedImageUrl() === image.url"
                    (click)="selectImage(image.url)"
                  />
                }
              </div>
            }
          </div>

          <div class="product-info">
            @if (product()?.collection) {
              <a 
                [routerLink]="['/store']" 
                [queryParams]="{collection: product()?.collection?.handle}"
                class="product-collection-link"
              >
                <p class="product-collection">{{ product()?.collection?.title }}</p>
              </a>
            }
            
            <h1>{{ product()?.title }}</h1>
            
            @if (selectedVariant()?.calculated_price) {
              <div class="product-price">
                @if (hasDiscountPrice()) {
                  <div>
                    <span class="original-price">{{ getFormattedOriginalPrice() }}</span>
                    <span class="sale-price">{{ getFormattedCalculatedPrice() }}</span>
                  </div>
                } @else {
                  <span class="price">{{ getFormattedCalculatedPrice() }}</span>
                }
              </div>
            }
            
            @if (product()?.description) {
              <div class="product-description">
                <p>{{ product()?.description }}</p>
              </div>
            }
            
            @if (productVariants().length > 1) {
              <div class="variant-selection">
                <h3>Select Variant</h3>
                <div class="variants-grid">
                  @for (variant of productVariants(); track variant.id) {
                    <button 
                      class="variant-button"
                      [class.selected]="selectedVariant()?.id === variant.id"
                      [class.disabled]="!isVariantAvailable(variant)"
                      (click)="selectVariant(variant)"
                      [disabled]="!isVariantAvailable(variant)"
                    >
                      {{ variant.title }}
                      @if (!isVariantAvailable(variant)) {
                        <span class="out-of-stock">Out of Stock</span>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <div class="quantity-cart">
              <div class="quantity-selector">
                <label for="quantity">Quantity:</label>
                <div class="quantity-controls">
                  <button 
                    type="button" 
                    (click)="decreaseQuantity()"
                    [disabled]="quantity() <= 1"
                    class="quantity-btn"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    id="quantity"
                    [ngModel]="quantity()"
                    (ngModelChange)="quantity.set($event)"
                    [min]="1"
                    [max]="getMaxQuantity()"
                    class="quantity-input"
                  />
                  <button 
                    type="button" 
                    (click)="increaseQuantity()"
                    [disabled]="quantity() >= getMaxQuantity()"
                    class="quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button 
                class="add-to-cart-btn"
                [disabled]="!selectedVariant() || !isVariantAvailable(selectedVariant()!) || isAddingToCart()"
                (click)="addToCart()"
              >
                @if (!isAddingToCart()) {
                  <span>Add to Cart</span>
                } @else {
                  <span>Adding...</span>
                }
              </button>
            </div>
            
            @if (addToCartMessage()) {
              <div class="cart-message" [class.success]="addToCartSuccess()">
                {{ addToCartMessage() }}
              </div>
            }

            <div class="product-details">
              @if (product()?.type) {
                <div class="detail-item">
                  <strong>Type:</strong> {{ product()?.type?.value }}
                </div>
              }
              @if (productTags().length > 0) {
                <div class="detail-item">
                  <strong>Tags:</strong>
                  @for (tag of productTags(); track tag.id; let last = $last) {
                    <span>{{ tag.value }}@if (!last) {<span>, </span>}</span>
                  }
                </div>
              }
              @if (selectedVariant()?.sku) {
                <div class="detail-item">
                  <strong>SKU:</strong> {{ selectedVariant()?.sku }}
                </div>
              }
            </div>
          </div>
        </div>
      }
      
      @if (isLoading()) {
        <div class="loading-state">
          <div class="container">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Loading product...</p>
            </div>
          </div>
        </div>
      }
      
      @if (error()) {
        <div class="error-state">
          <div class="container">
            <div class="error-message">
              <h2>Product not found</h2>
              <p>{{ error() }}</p>
              <button (click)="goBack()" class="back-button">Go Back</button>
            </div>
          </div>
        </div>
      }
      
      @if (product()?.collection?.metadata) {
        <div class="collection-inspired-section">
          <div class="container">
            @if (getCollectionMetadata('product_page_heading')) {
              <h2 class="collection-heading">{{ getCollectionMetadata('product_page_heading') }}</h2>
            }
            
            @if (getCollectionMetadata('product_page_image')) {
              <div class="collection-image">
                <img 
                  [src]="getCollectionMetadata('product_page_image')" 
                  [alt]="product()?.collection?.title || 'Collection image'"
                  class="collection-img"
                />
              </div>
            }
            
            @if (getCollectionMetadata('product_page_cta_heading')) {
              <div class="collection-cta">
                <h3 class="cta-heading">{{ getCollectionMetadata('product_page_cta_heading') }}</h3>
                @if (getCollectionMetadata('product_page_cta_link') && product()?.collection?.handle) {
                  <a 
                    [routerLink]="['/store']" 
                    [queryParams]="{collection: product()?.collection?.handle}"
                    class="cta-link"
                  >
                    {{ getCollectionMetadata('product_page_cta_link') }}
                  </a>
                }
              </div>
            }
          </div>
        </div>
      }
      
      <div class="related-products-section">
        <div class="container">
          <h2 class="section-title">Related Products</h2>
          @if (relatedProducts().length > 0) {
            <div class="related-products-grid">
              @for (relatedProduct of relatedProducts(); track relatedProduct.id) {
                <app-product-card [product]="relatedProduct" size="normal"></app-product-card>
              }
            </div>
          } @else if (isLoadingRelated()) {
            <div class="loading-related">
              <div class="spinner"></div>
              <p>Loading related products...</p>
            </div>
          } @else {
            <p class="no-related">No related products found.</p>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);
  private regionsService = inject(RegionsService);

  product = signal<HttpTypes.StoreProduct | null>(null);
  selectedVariant = signal<HttpTypes.StoreProductVariant | null>(null);
  selectedImageUrl = signal<string>('');
  quantity = signal<number>(1);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isAddingToCart = signal(false);
  addToCartMessage = signal<string | null>(null);
  addToCartSuccess = signal(false);
  relatedProducts = signal<HttpTypes.StoreProduct[]>([]);
  isLoadingRelated = signal(false);

  // Computed signals
  hasDiscountPrice = computed(() => {
    const variant = this.selectedVariant();
    if (!variant?.calculated_price) return false;
    const originalAmount = variant.calculated_price.original_amount || 0;
    const calculatedAmount = variant.calculated_price.calculated_amount || 0;
    return originalAmount > calculatedAmount;
  });

  productImages = computed(() => {
    return this.product()?.images || [];
  });

  productVariants = computed(() => {
    return this.product()?.variants || [];
  });

  productTags = computed(() => {
    return this.product()?.tags || [];
  });

  ngOnInit() {
    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const productHandle = params['handle'];
      if (productHandle) {
        // Reset state and scroll to top when navigating to a different product
        this.resetComponentState();
        this.scrollToTop();
        this.loadProduct(productHandle);
      }
    });
  }

  private resetComponentState() {
    this.isLoading.set(true);
    this.error.set(null);
    this.addToCartMessage.set(null);
    this.addToCartSuccess.set(false);
    this.quantity.set(1);
    this.relatedProducts.set([]);
    this.isLoadingRelated.set(false);
  }

  async loadProduct(productHandle: string) {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      // Get the first available region
      const regions = await this.regionsService.listRegions();
      const region = regions.length > 0 ? regions[0] : null;
      const regionId = region?.id;
      
      if (!regionId) {
        this.error.set('No region available. Please try again.');
        return;
      }
      
      // First try to get by handle (most common case for URLs)
      let product = await this.productsService.getProductByHandle(productHandle, regionId);
      
      // If not found by handle, try by ID
      if (!product) {
        product = await this.productsService.getProductById(productHandle, regionId);
      }
      
      if (product) {
        console.log('Product loaded successfully:', product);
        console.log('Product variants:', product.variants);
        this.product.set(product);
        
        // Select first available variant
        const firstVariant = product.variants?.[0] || null;
        console.log('Selected first variant:', firstVariant);
        this.selectedVariant.set(firstVariant);
        
        // Set default image
        this.selectedImageUrl.set(product.images?.[0]?.url || '');

        // Load related products
        await this.loadRelatedProducts();
      } else {
        console.log('Product not found');
        this.error.set('Product not found');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      this.error.set('Failed to load product. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectVariant(variant: HttpTypes.StoreProductVariant) {
    if (this.isVariantAvailable(variant)) {
      this.selectedVariant.set(variant);
      this.quantity.set(1); // Reset quantity when variant changes
    }
  }

  selectImage(imageUrl: string) {
    this.selectedImageUrl.set(imageUrl);
  }

  isVariantAvailable(variant: HttpTypes.StoreProductVariant): boolean {
    // If inventory is not managed, treat as available
    if (!variant.manage_inventory) {
      return true;
    }
    
    // If inventory_quantity is null or undefined, treat as available
    if (variant.inventory_quantity === null || variant.inventory_quantity === undefined) {
      return true;
    }
    
    return variant.inventory_quantity > 0;
  }

  getMaxQuantity(): number {
    const variant = this.selectedVariant();
    if (!variant) return 1;
    
    // If inventory is not managed, allow up to 99
    if (!variant.manage_inventory) {
      return 99;
    }
    
    // If inventory_quantity is null or undefined, allow up to 99
    if (variant.inventory_quantity === null || variant.inventory_quantity === undefined) {
      return 99;
    }
    
    return Math.max(1, variant.inventory_quantity);
  }

  increaseQuantity() {
    if (this.quantity() < this.getMaxQuantity()) {
      this.quantity.set(this.quantity() + 1);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  getFormattedOriginalPrice(): string {
    return this.formatCurrency(this.selectedVariant()?.calculated_price?.original_amount || 0);
  }

  getFormattedCalculatedPrice(): string {
    return this.formatCurrency(this.selectedVariant()?.calculated_price?.calculated_amount || 0);
  }

  async addToCart() {
    const variant = this.selectedVariant();
    const prod = this.product();
    
    console.log('Add to cart clicked');
    console.log('Selected variant:', variant);
    console.log('Product:', prod);
    console.log('Quantity:', this.quantity());
    
    if (!variant || !prod) {
      console.log('Missing variant or product, cannot add to cart');
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
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.addToCartMessage.set(null);
      }, 3000);

    } catch (error) {
      console.error('Error adding to cart:', error);
      this.addToCartMessage.set('Failed to add item to cart. Please try again.');
      this.addToCartSuccess.set(false);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        this.addToCartMessage.set(null);
      }, 5000);
    } finally {
      this.isAddingToCart.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/store']);
  }
  
  getCollectionMetadata(key: string): string | null {
    const metadata = this.product()?.collection?.metadata;
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    
    const value = (metadata as any)[key];
    
    // Handle image metadata
    if (key.includes('image') && value && typeof value === 'object' && 'url' in value) {
      return value.url;
    }
    
    // Handle string metadata
    if (typeof value === 'string') {
      return value;
    }
    
    return null;
  }
  
  async loadRelatedProducts() {
    if (!this.product()?.collection?.id) {
      return;
    }
    
    try {
      this.isLoadingRelated.set(true);
      
      // Get the current region for proper pricing
      const regions = await this.regionsService.listRegions();
      const region = regions.length > 0 ? regions[0] : null;
      
      const { products } = await this.productsService.getProductsList({
        collection_id: [this.product()!.collection!.id],
        region_id: region?.id,
        limit: 3
      });
      
      // Filter out the current product
      const relatedProducts = products.filter(p => p.id !== this.product()?.id);
      this.relatedProducts.set(relatedProducts);
      
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      this.isLoadingRelated.set(false);
    }
  }

  private scrollToTop() {
    // Immediate scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also scroll after a short delay to ensure content is loaded
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
} 