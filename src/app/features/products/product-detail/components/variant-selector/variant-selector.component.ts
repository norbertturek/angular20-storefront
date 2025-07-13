import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@ui/button/button.component';
import { HttpTypes } from '@medusajs/types';

@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    @if (variants().length > 1) {
      <div class="variant-selection">
        <h3 class="variant-title">Select Variant</h3>
        <div class="variants-grid">
          @for (variant of variants(); track variant.id) {
            <app-button 
              [class]="selectedVariantId() === variant.id ? 'active' : ''"
              (clicked)="selectVariant(variant)"
              [disabled]="!isVariantAvailable(variant)"
              [label]="variant.title + (!isVariantAvailable(variant) ? ' (Out of Stock)' : '')"
              variant="secondary"
              size="small"
            ></app-button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .variant-selection {
      margin-bottom: 2rem;
    }

    .variant-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .variants-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* Custom styles for disabled state */
    :host ::ng-deep .button--secondary.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .variants-grid {
        gap: 0.375rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductVariantSelectorComponent {
  // Inputs
  variants = input<HttpTypes.StoreProductVariant[]>([]);
  selectedVariantId = input<string | null>(null);

  // Outputs
  variantSelected = output<HttpTypes.StoreProductVariant>();

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

  selectVariant(variant: HttpTypes.StoreProductVariant) {
    if (this.isVariantAvailable(variant)) {
      this.variantSelected.emit(variant);
    }
  }
} 