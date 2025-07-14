# Podsumowanie plików wymagających testów jednostkowych

## 1. Serwisy (Services)
Wszystkie serwisy powinny mieć testy jednostkowe, szczególnie te z logiką biznesową lub komunikacją z API:

- ✅ src/app/core/api/auth.service.ts
- ✅ src/app/core/api/medusa.service.ts
- ✅ src/app/core/api/regions.service.ts
- ✅ src/app/core/api/product-types.service.ts
- 🚫 src/app/core/api/stripe.service.ts (pomiń: Stripe nie działa jeszcze wcale)
- ✅ src/app/core/services/collections.service.ts
- ✅ src/app/core/services/cart.service.ts
- ✅ src/app/core/services/error-handler.service.ts
- ✅ src/app/core/services/toast.service.ts
- ✅ src/app/features/search/search.service.ts
- ✅ src/app/features/products/products.service.ts
- ✅ src/app/features/cart/cart-drawer.service.ts

## 2. Komponenty (Components)
Każdy komponent powinien mieć testy jednostkowe, szczególnie te z logiką, obsługą zdarzeń lub prezentacją danych:

- src/app/app.component.ts
- src/app/features/cart/cart-drawer.component.ts
- src/app/features/cart/cart.component.ts
- src/app/features/products/product-detail/product-detail.component.ts
- src/app/features/products/product-detail/components/product-info/product-info.component.ts
- src/app/features/products/product-detail/components/product-images/product-images.component.ts
- src/app/features/products/product-detail/components/variant-selector/variant-selector.component.ts
- src/app/features/product-list/product-list.component.ts
- src/app/features/product-list/components/filters/product-list-filters.component.ts
- src/app/features/checkout/checkout.component.ts
- src/app/features/checkout/components/checkout-form/checkout-form.component.ts
- src/app/features/checkout/components/checkout-summary/checkout-summary.component.ts
- src/app/features/checkout/components/payment/payment.component.ts
- src/app/features/checkout/components/cart-totals/cart-totals.component.ts
- src/app/features/auth/register/register/register.component.ts
- src/app/features/search/search.component.ts
- src/app/shared/components/quantity-selector/quantity-selector.component.ts
- src/app/shared/components/toast/toast.component.ts
- src/app/shared/components/header/header.component.ts
- src/app/shared/components/promotional-banner/promotional-banner.component.ts
- src/app/shared/components/error-boundary/error-boundary.component.ts
- src/app/shared/components/footer/footer.component.ts
- src/app/shared/components/product-card/product-card.component.ts
- src/app/shared/components/search/search.component.ts
- src/app/shared/components/discount-code/discount-code.component.ts
- src/app/ui/button/button.component.ts
- src/app/ui/loading-spinner/loading-spinner.component.ts
- src/app/ui/title/title.component.ts
- src/app/features/home/components/hero/hero.component.ts
- src/app/features/home/components/collections/collections.component.ts
- src/app/features/home/components/about-preview/about-preview.component.ts
- src/app/features/home/components/product-types/product-types.component.ts
- src/app/features/static-pages/about/about.component.ts

## 3. Rekomendacje
- Priorytetowo testuj serwisy i komponenty z logiką biznesową, obsługą zdarzeń, walidacją, komunikacją z API.
- Komponenty prezentacyjne (czysto wizualne) mogą mieć uproszczone testy snapshotowe.
- Pliki konfiguracyjne, routingi i czyste modele/dto nie wymagają testów jednostkowych.

## 4. Pliki już posiadające testy
- src/app/app.component.spec.ts
- src/app/core/services/cart.service.spec.ts (testy aktualne)
- src/app/features/search/search.service.spec.ts
- src/app/features/products/products.service.spec.ts
- src/app/features/cart/cart-drawer.service.spec.ts

## 5. Pliki wymagające dodania testów
Wszystkie powyższe pliki poza src/app/app.component.ts, src/app/core/services/cart.service.ts, src/app/features/search/search.service.ts, src/app/features/products/products.service.ts, src/app/features/cart/cart-drawer.service.ts (które już mają testy spec).

---

Zalecane pokrycie testami: min. 80% kodu aplikacji (Angular best practices).