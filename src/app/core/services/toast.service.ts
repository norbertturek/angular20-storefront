import { signal, inject, InjectionToken, Signal, computed } from '@angular/core';

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

export interface ToastService {
  toasts: Signal<Toast[]>;
  hasToasts: Signal<boolean>;
  successToasts: Signal<Toast[]>;
  errorToasts: Signal<Toast[]>;
  warningToasts: Signal<Toast[]>;
  infoToasts: Signal<Toast[]>;
  show: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  success: (message: string, title?: string, options?: Partial<Toast>) => string;
  error: (message: string, title?: string, options?: Partial<Toast>) => string;
  warning: (message: string, title?: string, options?: Partial<Toast>) => string;
  info: (message: string, title?: string, options?: Partial<Toast>) => string;
  dismiss: (toastId: string) => void;
  dismissAll: () => void;
  dismissByType: (type: Toast['type']) => void;
  getToastStats: () => any;
}

export function createToastService(): ToastService {
  const toastsSignal = signal<Toast[]>([]);

  // Computed signals
  const toasts = toastsSignal.asReadonly();
  const hasToasts = computed(() => toasts().length > 0);
  const successToasts = computed(() => toasts().filter(toast => toast.type === 'success'));
  const errorToasts = computed(() => toasts().filter(toast => toast.type === 'error'));
  const warningToasts = computed(() => toasts().filter(toast => toast.type === 'warning'));
  const infoToasts = computed(() => toasts().filter(toast => toast.type === 'info'));

  const generateToastId = (): string => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const show = (toast: Omit<Toast, 'id' | 'timestamp'>): string => {
    const id = generateToastId();
    const fullToast: Toast = {
      ...toast,
      id,
      timestamp: new Date()
    };
    
    toastsSignal.update(toasts => [...toasts, fullToast]);
    
    if (fullToast.duration && fullToast.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, fullToast.duration);
    }

    return id;
  };

  const success = (message: string, title?: string, options?: Partial<Toast>): string => {
    return show({
      message,
      type: 'success',
      title,
      duration: 4000,
      dismissible: true,
      ...options
    });
  };

  const error = (message: string, title?: string, options?: Partial<Toast>): string => {
    return show({
      message,
      type: 'error',
      title,
      duration: 6000,
      dismissible: true,
      ...options
    });
  };

  const warning = (message: string, title?: string, options?: Partial<Toast>): string => {
    return show({
      message,
      type: 'warning',
      title,
      duration: 5000,
      dismissible: true,
      ...options
    });
  };

  const info = (message: string, title?: string, options?: Partial<Toast>): string => {
    return show({
      message,
      type: 'info',
      title,
      duration: 3000,
      dismissible: true,
      ...options
    });
  };

  const dismiss = (toastId: string): void => {
    toastsSignal.update(toasts => toasts.filter(toast => toast.id !== toastId));
  };

  const dismissAll = (): void => {
    toastsSignal.set([]);
  };

  const dismissByType = (type: Toast['type']): void => {
    toastsSignal.update(toasts => toasts.filter(toast => toast.type !== type));
  };

  const getToastStats = () => {
    const currentToasts = toasts();
    return {
      total: currentToasts.length,
      byType: {
        success: currentToasts.filter(t => t.type === 'success').length,
        error: currentToasts.filter(t => t.type === 'error').length,
        warning: currentToasts.filter(t => t.type === 'warning').length,
        info: currentToasts.filter(t => t.type === 'info').length
      }
    };
  };

  return {
    toasts,
    hasToasts,
    successToasts,
    errorToasts,
    warningToasts,
    infoToasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    dismissByType,
    getToastStats
  };
}

export function injectToastService(): ToastService {
  return inject(TOAST_SERVICE);
}

// Simple token for DI
export const TOAST_SERVICE = new InjectionToken<ToastService>('ToastService'); 