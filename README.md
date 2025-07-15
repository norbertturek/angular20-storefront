# Angular 20 Storefront for Medusa Ecommerce

Modern, production-ready storefront built with **Angular 20** specifically designed for **Medusa ecommerce platform**. Features standalone components, signals, lazy loading, and follows Angular best practices.

## 🚀 Features

### Ecommerce Functionality
- **Product Catalog** - Browse products with filtering and search
- **Product Details** - Detailed product pages with variants and images
- **Shopping Cart** - Add/remove items, quantity management
- **User Authentication** - Registration, login, password reset
- **Customer Dashboard** - Profile management, order history
- **Checkout Process** - Stripe integration for payments
- **Search** - Real-time product search with debouncing

### Technical Features
- **Angular 20** - Latest Angular with standalone components
- **Signals** - Modern reactive state management
- **Lazy Loading** - Route-based code splitting
- **SSR Ready** - Server-side rendering support
- **TypeScript** - Full type safety
- **Unit Tests** - Comprehensive test coverage with Jasmine/Karma

## 🏗️ Architecture

```
src/app/
├── core/           # Core services and API integration
│   ├── api/        # Medusa API services
│   ├── guards/     # Route guards
│   └── services/   # Shared services
├── features/       # Feature modules
│   ├── auth/       # Authentication
│   ├── cart/       # Shopping cart
│   ├── checkout/   # Checkout process
│   ├── products/   # Product management
│   └── account/    # Customer dashboard
├── shared/         # Shared components
└── ui/            # Reusable UI components
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Angular CLI 20+
- Medusa backend running on `http://localhost:9000`

### Installation
```bash
npm install
```

### Environment Configuration
Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  medusaBackendUrl: 'http://localhost:9000',
  medusaPublishableKey: 'your_publishable_key',
  stripePublishableKey: 'your_stripe_key'
};
```

### Development
```bash
ng serve
```
App runs at `http://localhost:4200`

### Build
```bash
ng build
```

### Testing
```bash
ng test
```

## 🔧 Key Services

### MedusaService
Core service for Medusa API integration:
```typescript
// Product operations
await medusaService.store.products.list()
await medusaService.store.products.retrieve(id)

// Cart operations
await medusaService.store.cart.create()
await medusaService.store.cart.createLineItem(cartId, lineItem)
```

### AuthService
Handles user authentication:
```typescript
// Registration
await authService.register(payload)

// Login
await authService.login(payload)

// Logout
authService.logout()
```

### CustomerService
Manages customer data and orders:
```typescript
// Update profile
await customerService.updateCustomer(payload)

// Get orders
await customerService.getOrders(limit, offset)
```

## 🛡️ Security

- **Route Guards** - Protected routes with `authGuard`
- **Token Management** - Automatic Bearer token injection
- **Input Validation** - Form validation and sanitization
- **Error Handling** - Comprehensive error management

## 🧪 Testing

- **Unit Tests** - 108 tests with 100% pass rate
- **Component Testing** - Isolated component testing
- **Service Testing** - Mock-based service testing
- **Guard Testing** - Route protection testing

## 🚀 Deployment

### Production Build
```bash
ng build --configuration production
```

### SSR Deployment
```bash
ng build --ssr
node dist/storefront/server/server.mjs
```

## 📦 Dependencies

### Core
- `@angular/*` - Angular 20 framework
- `@medusajs/js-sdk` - Medusa JavaScript SDK
- `@medusajs/types` - Medusa TypeScript types

### UI/UX
- `@stripe/stripe-js` - Stripe payment integration
- `ngx-stripe` - Angular Stripe wrapper

## 🔗 Medusa Integration

This storefront is specifically designed for Medusa ecommerce platform:

- **API Integration** - Full Medusa API coverage
- **Cart Management** - Medusa cart operations
- **Order Processing** - Medusa order workflow
- **Customer Management** - Medusa customer operations
- **Payment Processing** - Stripe integration via Medusa

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with Angular 20 and Medusa ecommerce platform**
