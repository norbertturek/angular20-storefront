# Angular 20 Refactoring Summary

## Overview
This document identifies all the places in the Angular storefront project where old Angular standards are used and need to be updated to Angular 20 best practices.

## Current Angular Version
- **Angular Version**: 20.0.0 ✅
- **Project Structure**: Standalone components ✅
- **Bootstrap Method**: Modern `bootstrapApplication()` ✅

## Issues Found

### 1. Lifecycle Hooks Usage (CRITICAL)

#### Problem: Using `OnInit` and `OnDestroy` instead of modern patterns
**Files affected:**
- `src/app/shared/components/header/header.component.ts`
- `src/app/features/home/home.component.ts`
- `src/app/features/checkout/checkout.component.ts`
- `src/app/features/store/store.component.ts`
- `src/app/features/products/product-detail/product-detail.component.ts`
- `src/app/features/search/search.component.ts`
- `src/app/shared/components/search/search.component.ts`
- `src/app/shared/components/cart-drawer/cart-drawer.component.ts`
- `src/app/features/checkout/components/payment/payment.component.ts`

**Current Pattern:**
```typescript
export class Component implements OnInit, OnDestroy {
  ngOnInit() {
    // Manual subscription management
    this.cartService.cart$.subscribe(cart => {
      // ...
    });
  }
  
  ngOnDestroy() {
    // Manual cleanup
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Recommended Angular 20 Pattern:**
```typescript
export class Component {
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);
  
  cart = signal<Cart | null>(null);
  
  constructor() {
    // Use takeUntilDestroyed for automatic cleanup
    this.cartService.cart$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cart => {
      this.cart.set(cart);
    });
  }
}
```

### 2. RxJS Observable Patterns (HIGH PRIORITY)

#### Problem: Using `BehaviorSubject` and manual Observable management
**Files affected:**
- `src/app/core/services/cart.service.ts`
- `src/app/core/services/regions.service.ts`

**Current Pattern:**
```typescript
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();
  
  updateCart(cart: Cart) {
    this.cartSubject.next(cart);
  }
}
```

**Recommended Angular 20 Pattern:**
```typescript
export class CartService {
  private cartSignal = signal<Cart | null>(null);
  cart = this.cartSignal.asReadonly();
  
  updateCart(cart: Cart) {
    this.cartSignal.set(cart);
  }
}
```

### 3. Template Structure (MEDIUM PRIORITY)

#### Problem: Inline templates instead of separate template files
**Files affected:**
- `src/app/features/home/home.component.ts` (250+ lines of inline template)
- `src/app/features/store/store.component.ts` (130+ lines of inline template)
- `src/app/features/products/product-detail/product-detail.component.ts` (250+ lines of inline template)
- `src/app/features/checkout/checkout.component.ts` (460+ lines of inline template)
- `src/app/features/search/search.component.ts` (100+ lines of inline template)
- `src/app/shared/components/search/search.component.ts` (100+ lines of inline template)

**Current Pattern:**
```typescript
@Component({
  template: `
    <div class="very-long-inline-template">
      <!-- 200+ lines of HTML -->
    </div>
  `
})
```

**Recommended Angular 20 Pattern:**
```typescript
@Component({
  templateUrl: './component.html',
  styleUrls: ['./component.scss']
})
```

### 4. Manual Subscription Management (HIGH PRIORITY)

#### Problem: Using `Subject` and manual cleanup
**Files affected:**
- `src/app/shared/components/search/search.component.ts`

**Current Pattern:**
```typescript
export class SearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.searchService.searchWithDebounce(this.searchQuery).pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      // ...
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Recommended Angular 20 Pattern:**
```typescript
export class SearchComponent {
  private searchService = inject(SearchService);
  private destroyRef = inject(DestroyRef);
  
  constructor() {
    this.searchService.searchWithDebounce(this.searchQuery).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      // ...
    });
  }
}
```

### 5. Component State Management (MEDIUM PRIORITY)

#### Problem: Using class properties instead of signals for reactive state
**Files affected:**
- `src/app/features/store/store.component.ts`
- `src/app/features/checkout/checkout.component.ts`

**Current Pattern:**
```typescript
export class StoreComponent {
  selectedType: string = '';
  selectedCollection: string = '';
  searchQuery: string = '';
  
  onFilterChange() {
    // Manual state updates
  }
}
```

**Recommended Angular 20 Pattern:**
```typescript
export class StoreComponent {
  selectedType = signal<string>('');
  selectedCollection = signal<string>('');
  searchQuery = signal<string>('');
  
  // Computed signals for derived state
  filteredProducts = computed(() => {
    // Reactive filtering logic
  });
}
```

### 6. Form Handling (MEDIUM PRIORITY)

#### Problem: Using `ngModel` instead of modern form controls
**Files affected:**
- `src/app/features/checkout/checkout.component.ts`
- `src/app/features/store/store.component.ts`

**Current Pattern:**
```typescript
export class CheckoutComponent {
  emailForm = {
    email: ''
  };
  
  // Template: [(ngModel)]="emailForm.email"
}
```

**Recommended Angular 20 Pattern:**
```typescript
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  
  // Template: [formControl]="emailForm.get('email')"
}
```

### 7. Route Parameter Handling (LOW PRIORITY)

#### Problem: Manual subscription to route parameters
**Files affected:**
- `src/app/features/products/product-detail/product-detail.component.ts`
- `src/app/features/store/store.component.ts`

**Current Pattern:**
```typescript
ngOnInit() {
  this.route.params.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(params => {
    const productHandle = params['handle'];
    // ...
  });
}
```

**Recommended Angular 20 Pattern:**
```typescript
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  
  productHandle = toSignal(this.route.params.pipe(
    map(params => params['handle'])
  ));
  
  product = computed(() => {
    const handle = this.productHandle();
    if (handle) {
      return this.loadProduct(handle);
    }
    return null;
  });
}
```

## Priority Levels

### CRITICAL (Must Fix)
1. **Lifecycle Hooks**: Replace `OnInit`/`OnDestroy` with modern patterns
2. **Manual Subscription Management**: Use `takeUntilDestroyed`

### HIGH PRIORITY (Should Fix)
1. **RxJS Patterns**: Replace `BehaviorSubject` with signals
2. **State Management**: Use signals for reactive state

### MEDIUM PRIORITY (Nice to Have)
1. **Template Structure**: Move inline templates to separate files
2. **Form Handling**: Use reactive forms
3. **Component State**: Use signals for all state

### LOW PRIORITY (Optional)
1. **Route Parameters**: Use `toSignal` for route params

## Benefits of Refactoring

1. **Better Performance**: Signals provide fine-grained reactivity
2. **Reduced Memory Leaks**: Automatic cleanup with `takeUntilDestroyed`
3. **Better Developer Experience**: Less boilerplate code
4. **Future-Proof**: Aligned with Angular's direction
5. **Better Testing**: Easier to test reactive patterns

## Migration Strategy

1. **Phase 1**: Fix lifecycle hooks and subscription management
2. **Phase 2**: Replace RxJS patterns with signals
3. **Phase 3**: Extract inline templates
4. **Phase 4**: Implement reactive forms
5. **Phase 5**: Optimize route parameter handling

## Files Requiring Immediate Attention

1. `src/app/shared/components/header/header.component.ts`
2. `src/app/features/checkout/checkout.component.ts`
3. `src/app/core/services/cart.service.ts`
4. `src/app/shared/components/search/search.component.ts`
5. `src/app/features/store/store.component.ts`

## Conclusion

The project is already using Angular 20 and standalone components, which is excellent. However, there are significant opportunities to modernize the codebase by adopting Angular 20's latest patterns, particularly around signals, lifecycle management, and reactive programming. The refactoring will result in a more maintainable, performant, and future-proof codebase. 