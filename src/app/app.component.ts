import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { CartDrawerComponent } from './features/cart/cart-drawer.component';

import { HeaderComponent } from '@sharedComponents/header/header.component';
import { FooterComponent } from '@sharedComponents/footer/footer.component';
import { ErrorBoundaryComponent } from '@sharedComponents/error-boundary/error-boundary.component';
import { ToastComponent } from '@sharedComponents/toast/toast.component';
import { PromotionalBannerComponent } from '@sharedComponents/promotional-banner/promotional-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, CartDrawerComponent, ErrorBoundaryComponent, ToastComponent, PromotionalBannerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'storefront';
}
