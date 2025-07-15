import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';

// Import all services
import { AuthService } from '@/app/core/api/auth.service';
import { CustomerService } from '@/app/core/api/customer.service';
import { MedusaService } from '@api/medusa.service';
import { RegionsService } from '@api/regions.service';
import { StripeService } from '@api/stripe.service';
import { ErrorHandlerService } from '@services/error-handler.service';
import { ToastService } from '@services/toast.service';
import { CartService } from '@services/cart.service';
import { CollectionsService } from '@services/collections.service';
import { CartDrawerService } from './features/cart/cart-drawer.service';
import { ProductsService } from './features/products/products.service';
import { SearchService } from './features/search/search.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      }),
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    ),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withFetch()),

    // Register all services as providers (class-based only)
    CartService,
    CollectionsService,
    ProductsService,
    SearchService,
    StripeService,
    MedusaService,
    CartDrawerService,
    ErrorHandlerService,
    AuthService,
    CustomerService,
    ToastService,
    RegionsService,
  ]
};
