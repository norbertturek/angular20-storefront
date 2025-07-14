import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonComponent } from '@ui/button/button.component';

@Component({
  selector: 'app-promotional-banner',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    @if (isVisible()) {
      <div class="promotional-banner">
        <div class="container">
          <div class="banner-content">
            <p class="banner-text">
              Sign up and get 20% off to your first order.
            </p>
            <div class="banner-actions">
              <app-button
                variant="light"
                size="small"
                label="Sign Up Now"
                (clicked)="onSignUpClick($event)"
              ></app-button>
            </div>
            <button 
              class="close-btn" 
              (click)="closeBanner()"
              aria-label="Close promotional banner"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .promotional-banner {
      background-color: #000;
      color: #fff;
      padding: 12px 0;
      position: relative;
      z-index: 1000;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .banner-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .banner-text {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      flex: 1;
    }

    .banner-actions {
      display: flex;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .close-btn:focus {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    @media (max-width: 768px) {
      .banner-content {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .banner-text {
        font-size: 13px;
      }

      .close-btn {
        position: absolute;
        top: 8px;
        right: 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionalBannerComponent {
  isVisible = signal(true);

  closeBanner(): void {
    this.isVisible.set(false);
  }

  onSignUpClick(event: MouseEvent | KeyboardEvent): void {
    // TODO: Implement sign up functionality
    console.log('Sign up clicked');
  }
} 