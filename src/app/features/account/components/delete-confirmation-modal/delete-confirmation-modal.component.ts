import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@/app/ui/button/button.component';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Delete Address</h2>
          <button class="modal-close" (click)="close()" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="confirmation-message">Are you sure you want to delete this address?</p>
        </div>
        
        <div class="modal-actions">
          <app-button 
            type="button" 
            label="No, Cancel" 
            variant="secondary" 
            (clicked)="close()"
          ></app-button>
          <app-button 
            type="button" 
            label="Yes, Delete" 
            variant="primary" 
            (clicked)="confirmDelete()"
            [disabled]="loading()"
          ></app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 400px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 0 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1rem;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: #222;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      color: #666;
      transition: color 0.2s ease;
      
      &:hover {
        color: #222;
        background-color: #f3f4f6;
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .confirmation-message {
      font-size: 1rem;
      color: #333;
      margin: 0;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 0 1.5rem 1.5rem 1.5rem;
    }

    @media (max-width: 640px) {
      .modal-overlay {
        padding: 0.5rem;
      }
      
      .modal-content {
        max-width: 100%;
      }
      
      .modal-actions {
        flex-direction: column-reverse;
      }
    }
  `]
})
export class DeleteConfirmationModalComponent {
  // Modal state
  isOpen = signal(false);
  addressId = signal<string | null>(null);
  loading = signal(false);

  // Callback function to execute on confirmation
  private onConfirmCallback: ((addressId: string) => Promise<void>) | null = null;

  open(addressId: string, onConfirm: (addressId: string) => Promise<void>) {
    this.isOpen.set(true);
    this.addressId.set(addressId);
    this.onConfirmCallback = onConfirm;
  }

  close() {
    this.isOpen.set(false);
    this.addressId.set(null);
    this.onConfirmCallback = null;
    this.loading.set(false);
  }

  async confirmDelete() {
    if (!this.addressId() || !this.onConfirmCallback) {
      return;
    }

    this.loading.set(true);
    
    try {
      await this.onConfirmCallback(this.addressId()!);
      this.close();
    } catch (error) {
      // Error handling is done in the callback
      this.loading.set(false);
    }
  }
} 