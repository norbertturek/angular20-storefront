import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal, Signal, inject, InjectionToken } from '@angular/core';

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  context?: string;
  details?: any;
  dismissible?: boolean;
  autoDismiss?: boolean;
  dismissTimeout?: number;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorHandlerService {
  errors: Signal<AppError[]>;
  hasErrors: Signal<boolean>;
  isGlobalError: Signal<boolean>;
  globalErrorMessage: Signal<string | null>;
  criticalErrors: Signal<AppError[]>;
  warnings: Signal<AppError[]>;
  infoMessages: Signal<AppError[]>;
  handleError: (error: Error | HttpErrorResponse | string, context?: ErrorContext) => void;
  handleHttpError: (error: HttpErrorResponse, context?: ErrorContext) => void;
  handleGlobalError: (error: Error | string) => void;
  addError: (error: AppError) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  clearGlobalError: () => void;
  retryLastAction: () => void;
  getErrorStats: () => any;
}

export function createErrorHandlerService(): ErrorHandlerService {
  // Signal-based error state
  const errorsState = signal<AppError[]>([]);
  const isGlobalErrorState = signal<boolean>(false);
  const globalErrorMessageState = signal<string | null>(null);

  // Public signals
  const errors = computed(() => errorsState());
  const hasErrors = computed(() => errors().length > 0);
  const isGlobalError = computed(() => isGlobalErrorState());
  const globalErrorMessage = computed(() => globalErrorMessageState());

  // Computed signals for different error types
  const criticalErrors = computed(() => 
    errors().filter(error => error.type === 'error')
  );
  
  const warnings = computed(() => 
    errors().filter(error => error.type === 'warning')
  );
  
  const infoMessages = computed(() => 
    errors().filter(error => error.type === 'info')
  );

  // Utility functions
  const createAppError = (
    error: Error | HttpErrorResponse | string,
    context?: ErrorContext,
    type: 'error' | 'warning' | 'info' = 'error',
    details?: any
  ): AppError => {
    const message = typeof error === 'string' ? error : error.message;
    
    return {
      id: generateErrorId(),
      message: sanitizeErrorMessage(message),
      type,
      timestamp: new Date(),
      context: context?.component || 'Unknown',
      details,
      dismissible: true,
      autoDismiss: type === 'info',
      dismissTimeout: type === 'info' ? 5000 : undefined
    };
  };

  const getHttpErrorMessage = (error: HttpErrorResponse): string => {
    if (error.error?.message) {
      return error.error.message;
    }
    
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'Access denied. You don\'t have permission for this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. The resource already exists.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Bad gateway. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const sanitizeErrorMessage = (message: string): string => {
    // Remove sensitive information and sanitize error messages
    return message
      .replace(/password|token|key|secret/gi, '[REDACTED]')
      .replace(/http:\/\/.*?\/|https:\/\/.*?\/|localhost:\d+/g, '[URL]')
      .trim();
  };

  const generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const logError = (error: AppError): void => {
    // In production, this would send to error monitoring service
    console.error('Application Error:', {
      id: error.id,
      message: error.message,
      type: error.type,
      context: error.context,
      timestamp: error.timestamp,
      details: error.details
    });
  };

  const logHttpError = (error: HttpErrorResponse, context?: ErrorContext): void => {
    // In production, this would send to error monitoring service
    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      context,
      timestamp: new Date()
    });
  };

  // Error handling methods
  const handleError = (error: Error | HttpErrorResponse | string, context?: ErrorContext): void => {
    const appError = createAppError(error, context);
    addError(appError);
    
    // Log error for debugging
    logError(appError);
  };

  const handleHttpError = (error: HttpErrorResponse, context?: ErrorContext): void => {
    const message = getHttpErrorMessage(error);
    const appError = createAppError(message, context, 'error', { httpError: error });
    addError(appError);
    
    // Log HTTP error
    logHttpError(error, context);
  };

  const handleGlobalError = (error: Error | string): void => {
    isGlobalErrorState.set(true);
    globalErrorMessageState.set(typeof error === 'string' ? error : error.message);
    
    // Auto-dismiss global error after 10 seconds
    setTimeout(() => {
      clearGlobalError();
    }, 10000);
  };

  // Error management methods
  const addError = (error: AppError): void => {
    errorsState.update(errors => [...errors, error]);
    
    // Auto-dismiss if configured
    if (error.autoDismiss && error.dismissTimeout) {
      setTimeout(() => {
        removeError(error.id);
      }, error.dismissTimeout);
    }
  };

  const removeError = (errorId: string): void => {
    errorsState.update(errors => 
      errors.filter(error => error.id !== errorId)
    );
  };

  const clearErrors = (): void => {
    errorsState.set([]);
  };

  const clearGlobalError = (): void => {
    isGlobalErrorState.set(false);
    globalErrorMessageState.set(null);
  };

  // Error recovery methods
  const retryLastAction = (): void => {
    // This would be implemented based on the last failed action
    console.log('Retrying last action...');
  };

  // Error analytics
  const getErrorStats = () => {
    const currentErrors = errors();
    return {
      total: currentErrors.length,
      byType: {
        error: currentErrors.filter(e => e.type === 'error').length,
        warning: currentErrors.filter(e => e.type === 'warning').length,
        info: currentErrors.filter(e => e.type === 'info').length
      },
      byContext: currentErrors.reduce((acc, error) => {
        acc[error.context || 'Unknown'] = (acc[error.context || 'Unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return {
    errors,
    hasErrors,
    isGlobalError,
    globalErrorMessage,
    criticalErrors,
    warnings,
    infoMessages,
    handleError,
    handleHttpError,
    handleGlobalError,
    addError,
    removeError,
    clearErrors,
    clearGlobalError,
    retryLastAction,
    getErrorStats
  };
}

export function injectErrorHandlerService(): ErrorHandlerService {
  return inject(ERROR_HANDLER_SERVICE);
}

// Simple token for DI
export const ERROR_HANDLER_SERVICE = new InjectionToken<ErrorHandlerService>('ErrorHandlerService'); 