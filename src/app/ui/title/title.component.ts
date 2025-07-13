import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TitleSize = 'small' | 'medium' | 'large' | 'xl';
export type TitleAlignment = 'left' | 'center' | 'right';

@Component({
  selector: 'app-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 
      class="title"
      [class]="titleClasses()"
    >
      {{ label() }}
    </h2>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TitleComponent {
  // Input signals
  label = input<string>('');
  size = input<TitleSize>('xl');
  alignment = input<TitleAlignment>('center');

  // Computed signals
  titleClasses = computed(() => {
    const classes = ['title'];
    
    if (this.size()) {
      classes.push(`title--${this.size()}`);
    }
    
    if (this.alignment()) {
      classes.push(`title--${this.alignment()}`);
    }
    
    return classes.join(' ');
  });
} 