import { Injectable, computed, signal, Signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

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

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private errorsState = signal<AppError[]>([]);
  private isGlobalErrorState = signal<boolean>(false);
  private globalErrorMessageState = signal<string | null>(null);

  public errors = computed(() => this.errorsState());
  public hasErrors = computed(() => this.errors().length > 0);
  public isGlobalError = computed(() => this.isGlobalErrorState());
  public globalErrorMessage = computed(() => this.globalErrorMessageState());
  public criticalErrors = computed(() => this.errors().filter(error => error.type === 'error'));
  public warnings = computed(() => this.errors().filter(error => error.type === 'warning'));
  public infoMessages = computed(() => this.errors().filter(error => error.type === 'info'));

  private createAppError(
    error: Error | HttpErrorResponse | string,
    context?: ErrorContext,
    type: 'error' | 'warning' | 'info' = 'error',
    details?: any
  ): AppError {
    const message = typeof error === 'string' ? error : error.message;
    return {
      id: this.generateErrorId(),
      message: this.sanitizeErrorMessage(message),
      type,
      timestamp: new Date(),
      context: context?.component || 'Unknown',
      details,
      dismissible: true,
      autoDismiss: type === 'info',
      dismissTimeout: type === 'info' ? 5000 : undefined
    };
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
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
  }

  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/password|token|key|secret/gi, '[REDACTED]')
      .replace(/http:\/\/.*?\/|https:\/\/.*?\/|localhost:\d+/g, '[URL]')
      .trim();
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: AppError): void {
    console.error('Application Error:', {
      id: error.id,
      message: error.message,
      type: error.type,
      context: error.context,
      timestamp: error.timestamp,
      details: error.details
    });
  }

  private logHttpError(error: HttpErrorResponse, context?: ErrorContext): void {
    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      context,
      timestamp: new Date()
    });
  }

  handleError(error: Error | HttpErrorResponse | string, context?: ErrorContext): void {
    const appError = this.createAppError(error, context);
    this.addError(appError);
    this.logError(appError);
  }

  handleHttpError(error: HttpErrorResponse, context?: ErrorContext): void {
    const message = this.getHttpErrorMessage(error);
    const appError = this.createAppError(message, context, 'error', { httpError: error });
    this.addError(appError);
    this.logHttpError(error, context);
  }

  handleGlobalError(error: Error | string): void {
    this.isGlobalErrorState.set(true);
    this.globalErrorMessageState.set(typeof error === 'string' ? error : error.message);
    setTimeout(() => {
      this.clearGlobalError();
    }, 10000);
  }

  addError(error: AppError): void {
    this.errorsState.update(errors => [...errors, error]);
    if (error.autoDismiss && error.dismissTimeout) {
      setTimeout(() => {
        this.removeError(error.id);
      }, error.dismissTimeout);
    }
  }

  removeError(errorId: string): void {
    this.errorsState.update(errors => errors.filter(error => error.id !== errorId));
  }

  clearErrors(): void {
    this.errorsState.set([]);
  }

  clearGlobalError(): void {
    this.isGlobalErrorState.set(false);
    this.globalErrorMessageState.set(null);
  }

  retryLastAction(): void {
    console.log('Retrying last action...');
  }

  getErrorStats() {
    const currentErrors = this.errors();
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
  }
} 