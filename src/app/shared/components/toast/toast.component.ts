import { CommonModule } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { injectToastService } from '@services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (toast of visibleToasts(); track toast.id) {
        <div 
          class="toast"
          [class]="'toast-' + toast.type">
          
          <!-- Toast Icon -->
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              @case ('info') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              }
            }
          </div>

          <!-- Toast Content -->
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>

          <!-- Toast Actions -->
          <div class="toast-actions">
            @if (toast.action) {
              <button 
                class="toast-action-btn"
                (click)="toast.action!.callback()">
                {{ toast.action.label }}
              </button>
            }
            @if (toast.dismissible) {
              <button 
                class="toast-dismiss-btn"
                (click)="dismissToast(toast.id)"
                aria-label="Dismiss toast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            }
          </div>

          <!-- Progress Bar -->
          @if (toast.duration && toast.duration > 0) {
            <div class="toast-progress">
              <div 
                class="toast-progress-bar"
                [style.animation-duration]="toast.duration + 'ms'">
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      background: white;
      border-left: 4px solid;
      pointer-events: auto;
      position: relative;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      border-left-color: #10b981;
      color: #065f46;
    }

    .toast-error {
      border-left-color: #ef4444;
      color: #991b1b;
    }

    .toast-warning {
      border-left-color: #f59e0b;
      color: #92400e;
    }

    .toast-info {
      border-left-color: #3b82f6;
      color: #1e40af;
    }

    .toast-icon {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .toast-message {
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .toast-action-btn {
      background: transparent;
      border: 1px solid currentColor;
      color: currentColor;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toast-action-btn:hover {
      background: currentColor;
      color: white;
    }

    .toast-dismiss-btn {
      background: transparent;
      border: none;
      color: currentColor;
      padding: 0.25rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-dismiss-btn:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0, 0, 0, 0.1);
    }

    .toast-progress-bar {
      height: 100%;
      background: currentColor;
      animation: progressShrink linear forwards;
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

    @keyframes progressShrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    /* Mobile adjustments */
    @media (max-width: 640px) {
      .toast-container {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }
      
      .toast {
        padding: 0.75rem;
      }
      
      .toast-actions {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `]
})
export class ToastComponent {
  private toastService = injectToastService();

  // Computed signal for visible toasts (limit to 5 to prevent overflow)
  visibleToasts = computed(() => {
    const toasts = this.toastService.toasts();
    return toasts.slice(-5); // Show only last 5 toasts
  });

  dismissToast(toastId: string): void {
    this.toastService.dismiss(toastId);
  }
} 