import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';
import { SearchComponent } from '../search/search.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchComponent],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <div class="logo">
            <a routerLink="/" class="logo-link">
              <h1>Sofa Society</h1>
            </a>
          </div>

          <!-- Navigation -->
          <nav class="nav-menu">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Home</a>
            <a routerLink="/store" routerLinkActive="active" class="nav-link">Store</a>
            <a routerLink="/about" routerLinkActive="active" class="nav-link">About</a>
          </nav>

          <!-- Actions -->
          <div class="header-actions">
            <app-search></app-search>
            
            <button class="cart-btn" (click)="cartDrawerService.open()" aria-label="Shopping Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"/>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"/>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"/>
              </svg>
              @if (cartQuantity() > 0) {
                <span class="cart-count">{{ cartQuantity() }}</span>
              }
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);
  cartDrawerService = inject(CartDrawerService);
  
  cartQuantity = signal(0);

  ngOnInit() {
    this.cartService.cart$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cart => {
      this.cartQuantity.set(this.cartService.getCartQuantity());
    });
  }
} 