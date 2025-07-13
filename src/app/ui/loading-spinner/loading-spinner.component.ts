import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-spinner">
      <div class="spinner"></div>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    .loading-spinner p {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.4;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Size variants */
    .loading-spinner.small .spinner {
      width: 1.5rem;
      height: 1.5rem;
      border-width: 1.5px;
      margin-bottom: 0.75rem;
    }

    .loading-spinner.small p {
      font-size: 0.75rem;
    }

    .loading-spinner.large .spinner {
      width: 3rem;
      height: 3rem;
      border-width: 3px;
      margin-bottom: 1.5rem;
    }

    .loading-spinner.large p {
      font-size: 1rem;
    }

    /* Compact variant for inline use */
    .loading-spinner.compact {
      padding: 1rem;
    }

    .loading-spinner.compact .spinner {
      margin-bottom: 0.5rem;
    }
  `]
})
export class LoadingSpinnerComponent {
  message = input<string>('Loading...');
  size = input<'small' | 'normal' | 'large'>('normal');
  variant = input<'default' | 'compact'>('default');

  get spinnerClasses(): string {
    const classes = ['loading-spinner'];
    if (this.size() !== 'normal') {
      classes.push(this.size());
    }
    if (this.variant() === 'compact') {
      classes.push('compact');
    }
    return classes.join(' ');
  }
} 