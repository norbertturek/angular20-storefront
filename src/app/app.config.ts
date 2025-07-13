import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';

// Import all services
import { CartDrawerService } from './features/cart/cart-drawer.service';
import { createCartService, CART_SERVICE } from './core/services/cart.service';
import { createErrorHandlerService, ERROR_HANDLER_SERVICE } from '@services/error-handler.service';
import { createMedusaService, MEDUSA_SERVICE } from '@api/medusa.service';
import { ProductsService } from './features/products/products.service';
import { createRegionsService, REGIONS_SERVICE } from '@api/regions.service';
import { SearchService } from './features/search/search.service';
import { createStripeService, STRIPE_SERVICE } from '@api/stripe.service';
import { createToastService, TOAST_SERVICE } from '@services/toast.service';

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
    provideHttpClient(withFetch()),
    
    // Register all services as providers
    { provide: CART_SERVICE, useFactory: createCartService },
    { provide: REGIONS_SERVICE, useFactory: createRegionsService },
    ProductsService,
    SearchService,
    { provide: STRIPE_SERVICE, useFactory: createStripeService },
    { provide: MEDUSA_SERVICE, useFactory: createMedusaService },
    CartDrawerService,
    { provide: ERROR_HANDLER_SERVICE, useFactory: createErrorHandlerService },
    
    // Functional service providers
    { provide: TOAST_SERVICE, useFactory: createToastService }
  ]
};
