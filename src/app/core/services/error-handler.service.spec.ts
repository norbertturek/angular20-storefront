import { ErrorHandlerService, AppError } from './error-handler.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    jasmine.clock().uninstall();
    jasmine.clock().install();
    service = new ErrorHandlerService();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should add and remove errors', () => {
    const error: AppError = {
      id: '1',
      message: 'Test error',
      type: 'error',
      timestamp: new Date(),
    };
    service.addError(error);
    expect(service.errors().length).toBe(1);
    service.removeError('1');
    expect(service.errors().length).toBe(0);
  });

  it('should handle a string error', () => {
    service.handleError('String error');
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].message).toContain('String error');
  });

  it('should handle an Error object', () => {
    service.handleError(new Error('Error object'));
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].message).toContain('Error object');
  });

  it('should handle HttpErrorResponse and map status', () => {
    const httpError = new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: '/test', error: {} });
    service.handleHttpError(httpError);
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].message).toContain('Resource not found');
  });

  it('should auto-dismiss info errors', () => {
    const error: AppError = {
      id: 'auto',
      message: 'Info',
      type: 'info',
      timestamp: new Date(),
      autoDismiss: true,
      dismissTimeout: 5000,
    };
    service.addError(error);
    expect(service.errors().length).toBe(1);
    jasmine.clock().tick(5001);
    expect(service.errors().length).toBe(0);
  });

  it('should set and clear global error', () => {
    service.handleGlobalError('Global error');
    expect(service.isGlobalError()).toBeTrue();
    expect(service.globalErrorMessage()).toBe('Global error');
    jasmine.clock().tick(10001);
    expect(service.isGlobalError()).toBeFalse();
    expect(service.globalErrorMessage()).toBeNull();
  });

  it('should clear all errors', () => {
    service.handleError('err1');
    service.handleError('err2');
    expect(service.errors().length).toBe(2);
    service.clearErrors();
    expect(service.errors().length).toBe(0);
  });

  it('should filter errors by type', () => {
    service.addError({ id: 'e1', message: 'err', type: 'error', timestamp: new Date() });
    service.addError({ id: 'w1', message: 'warn', type: 'warning', timestamp: new Date() });
    service.addError({ id: 'i1', message: 'info', type: 'info', timestamp: new Date() });
    expect(service.criticalErrors().length).toBe(1);
    expect(service.warnings().length).toBe(1);
    expect(service.infoMessages().length).toBe(1);
  });

  it('should sanitize error messages', () => {
    service.handleError('Sensitive password: 1234');
    expect(service.errors()[0].message).not.toContain('password: 1234');
    expect(service.errors()[0].message).toContain('[REDACTED]');
  });
}); 