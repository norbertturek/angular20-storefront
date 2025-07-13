import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large' | 'compact';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (routerLink()) {
      <a 
        [routerLink]="routerLink()" 
        [queryParams]="queryParams()"
        class="button"
        [class]="buttonClasses()"
        [attr.disabled]="disabled() || loading() ? '' : null"
        [attr.aria-label]="ariaLabel()"
        role="button"
        (click)="onClick($event)"
        (keydown.enter)="onKeyDown($any($event))"
        (keydown.space)="onKeyDown($any($event))"
        tabindex="0"
      >
        @if (loading()) {
          <div class="button-spinner">
            <div class="spinner"></div>
          </div>
        }
        <span class="button-text">
          {{label() }}
        </span>
      </a>
    } @else {
      <button 
        [type]="type()"
        class="button"
        [class]="buttonClasses()"
        [attr.disabled]="disabled() || loading() ? '' : null"
        [attr.aria-label]="ariaLabel()"
        (click)="onClick($event)"
        (keydown.enter)="onKeyDown($any($event))"
        (keydown.space)="onKeyDown($any($event))"
      >
        @if (loading()) {
          <div class="button-spinner">
            <div class="spinner"></div>
          </div>
        }
        <span class="button-text">
          {{label() }}
        </span>
      </button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  // Input signals
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('medium');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  routerLink = input<string | undefined>(undefined);
  queryParams = input<Record<string, any> | undefined>(undefined);
  label = input<string | undefined>(undefined);
  class = input<string | undefined>(undefined);
  type = input<'button' | 'submit' | 'reset'>('button');



  // Output signal
  clicked = output<MouseEvent | KeyboardEvent>();

  // Computed signals
  buttonClasses = computed(() => {
    const classes = ['button'];
    
    if (this.variant()) {
      classes.push(`button--${this.variant()}`);
    }
    
    if (this.size()) {
      classes.push(`button--${this.size()}`);
    }
    
    if (this.class()) {
      classes.push(this.class()!);
    }
    
    return classes.join(' ');
  });

  ariaLabel = computed(() => {
    return this.loading() ? 'Loading...' : undefined;
  });

// Event handlers
  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.disabled() && !this.loading()) {
      // Prevent default space behavior (page scroll)
      if (event.code === 'Space') {
        event.preventDefault();
      }
      this.clicked.emit(event);
    }
  }
} 
