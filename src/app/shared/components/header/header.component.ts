import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID, signal, Signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

import { CartDrawerService } from '@/app/features/cart/cart-drawer.service';
import { CartService } from '@services/cart.service';

import { SearchComponent } from '@sharedComponents/search/search.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private cartService = inject(CartService);
  cartDrawerService = inject(CartDrawerService);
  private platformId = inject(PLATFORM_ID);

  cartQuantity = signal(0);

  effect = effect(() => {
    const cart = this.cartService.cart();
    this.cartQuantity.set(this.cartService.getCartQuantity());
  });

  private router = inject(Router);

  // Signal: are we on the homepage?
  readonly isHome = signal<boolean>(this.router.url === '/');

  // Signal: should header be transparent?
  readonly isTransparent = signal<boolean>(true);

  // Signal: header class
  readonly headerClass: Signal<string> = computed(() => {
    if (!this.isHome()) return 'header';
    return this.isTransparent() ? 'header header--transparent' : 'header header--scrolled';
  });

  // On init: set up router and scroll listeners
  constructor() {
    // Update isHome on navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isHome.set(this.router.url === '/');
      }
    });

    // Only listen to scroll if on home and in browser
    effect(() => {
      if (!this.isHome() || !isPlatformBrowser(this.platformId)) {
        this.isTransparent.set(false);
        return;
      }
      // Get hero height
      const hero = document.querySelector('.hero') as HTMLElement | null;
      if (!hero) {
        this.isTransparent.set(true);
        return;
      }
      const heroHeight = hero.offsetHeight;
      // Listen to scroll
      const onScroll = () => {
        const scrollY = window.scrollY;
        this.isTransparent.set(scrollY < heroHeight - 64); // 64px buffer for header height
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      // Initial check
      onScroll();
      // Cleanup
      return () => window.removeEventListener('scroll', onScroll);
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
} 