import { Injectable, signal, computed, Signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  duration?: number;
  dismissible?: boolean;
  timestamp: Date;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);

  public toasts: Signal<Toast[]> = this.toastsSignal.asReadonly();
  public hasToasts = computed(() => this.toasts() && this.toasts().length > 0);
  public successToasts = computed(() => this.toasts().filter(toast => toast.type === 'success'));
  public errorToasts = computed(() => this.toasts().filter(toast => toast.type === 'error'));
  public warningToasts = computed(() => this.toasts().filter(toast => toast.type === 'warning'));
  public infoToasts = computed(() => this.toasts().filter(toast => toast.type === 'info'));

  private generateToastId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  show(toast: Omit<Toast, 'id' | 'timestamp'>): string {
    const id = this.generateToastId();
    const fullToast: Toast = {
      ...toast,
      id,
      timestamp: new Date()
    };
    this.toastsSignal.update(toasts => [...toasts, fullToast]);
    if (fullToast.duration && fullToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, fullToast.duration);
    }
    return id;
  }

  success(message: string, title?: string, options?: Partial<Toast>): string {
    return this.show({
      message,
      type: 'success',
      title,
      duration: 4000,
      dismissible: true,
      ...options
    });
  }

  error(message: string, title?: string, options?: Partial<Toast>): string {
    return this.show({
      message,
      type: 'error',
      title,
      duration: 6000,
      dismissible: true,
      ...options
    });
  }

  warning(message: string, title?: string, options?: Partial<Toast>): string {
    return this.show({
      message,
      type: 'warning',
      title,
      duration: 5000,
      dismissible: true,
      ...options
    });
  }

  info(message: string, title?: string, options?: Partial<Toast>): string {
    return this.show({
      message,
      type: 'info',
      title,
      duration: 3000,
      dismissible: true,
      ...options
    });
  }

  dismiss(toastId: string): void {
    this.toastsSignal.update(toasts => toasts.filter(toast => toast.id !== toastId));
  }

  dismissAll(): void {
    this.toastsSignal.set([]);
  }

  dismissByType(type: Toast['type']): void {
    this.toastsSignal.update(toasts => toasts.filter(toast => toast.type !== type));
  }

  getToastStats() {
    const currentToasts = this.toasts();
    return {
      total: currentToasts.length,
      byType: {
        success: currentToasts.filter(t => t.type === 'success').length,
        error: currentToasts.filter(t => t.type === 'error').length,
        warning: currentToasts.filter(t => t.type === 'warning').length,
        info: currentToasts.filter(t => t.type === 'info').length
      }
    };
  }
} 