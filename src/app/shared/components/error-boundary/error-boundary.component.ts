import { CommonModule } from '@angular/common';
import { Component, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { injectErrorHandlerService, AppError } from '@services/error-handler.service';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorHandlerService.hasErrors()) {
      <div class="error-boundary">
        <div class="error-container">
          @for (error of errorHandlerService.errors(); track error.id) {
            <div 
              class="error-message"
              [class]="'error-' + error.type"
            >
              <div class="error-content">
                <div class="error-icon">
                  @switch (error.type) {
                    @case ('error') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    }
                    @case ('warning') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                      </svg>
                    }
                    @case ('info') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                      </svg>
                    }
                  }
                </div>
                
                <div class="error-text">
                  <div class="error-message-text">{{ error.message }}</div>
                  @if (error.context && error.context !== 'Unknown') {
                    <div class="error-context">{{ error.context }}</div>
                  }
                </div>
                
                @if (error.dismissible) {
                  <button 
                    class="error-dismiss"
                    (click)="dismissError(error.id)"
                    aria-label="Dismiss error"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                }
              </div>
              
              @if (error.type === 'error' && showRetryButton()) {
                <div class="error-actions">
                  <button 
                    class="retry-button"
                    (click)="retryAction()"
                  >
                    Try Again
                  </button>
                </div>
              }
            </div>
          }
          
          @if (errorHandlerService.errors().length > 1) {
            <button 
              class="clear-all-button"
              (click)="clearAllErrors()"
            >
              Clear All
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .error-boundary {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      width: 100%;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .error-message {
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid;
    }

    .error-error {
      background-color: #fef2f2;
      border-color: #ef4444;
      color: #991b1b;
    }

    .error-warning {
      background-color: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
    }

    .error-info {
      background-color: #eff6ff;
      border-color: #3b82f6;
      color: #1e40af;
    }

    .error-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .error-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .error-text {
      flex: 1;
      min-width: 0;
    }

    .error-message-text {
      font-weight: 500;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .error-context {
      font-size: 0.875rem;
      opacity: 0.8;
      font-style: italic;
    }

    .error-dismiss {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .error-dismiss:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .error-actions {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .retry-button {
      background-color: currentColor;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .retry-button:hover {
      opacity: 0.9;
    }

    .clear-all-button {
      background-color: #6b7280;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      align-self: flex-end;
    }

    .clear-all-button:hover {
      background-color: #4b5563;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .error-boundary {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `]
})
export class ErrorBoundaryComponent {
  errorHandlerService = injectErrorHandlerService();
  
  // Signal to track if retry button should be shown
  private showRetryState = signal(false);
  showRetryButton = computed(() => this.showRetryState());

  // Effect to show retry button for critical errors
  effect = (() => {
    const criticalErrors = this.errorHandlerService.criticalErrors();
    this.showRetryState.set(criticalErrors.length > 0);
  })();

  dismissError(errorId: string): void {
    this.errorHandlerService.removeError(errorId);
  }

  clearAllErrors(): void {
    this.errorHandlerService.clearErrors();
  }

  retryAction(): void {
    this.errorHandlerService.retryLastAction();
    // Clear errors after retry attempt
    setTimeout(() => {
      this.errorHandlerService.clearErrors();
    }, 1000);
  }
} 