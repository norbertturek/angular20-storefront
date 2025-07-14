import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a toast', () => {
    const toastId = service.show({
      message: 'Test message',
      type: 'info',
      dismissible: true
    });

    expect(toastId).toBeDefined();
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.hasToasts()).toBeTrue();
  });

  it('should show success toast', () => {
    const toastId = service.success('Success message', 'Success');

    expect(toastId).toBeDefined();
    expect(service.toasts().length).toBe(1);
    expect(service.successToasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].title).toBe('Success');
    expect(service.toasts()[0].message).toBe('Success message');
  });

  it('should show error toast', () => {
    const toastId = service.error('Error message', 'Error');

    expect(toastId).toBeDefined();
    expect(service.toasts().length).toBe(1);
    expect(service.errorToasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].title).toBe('Error');
    expect(service.toasts()[0].message).toBe('Error message');
  });

  it('should show warning toast', () => {
    const toastId = service.warning('Warning message', 'Warning');

    expect(toastId).toBeDefined();
    expect(service.toasts().length).toBe(1);
    expect(service.warningToasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('warning');
    expect(service.toasts()[0].title).toBe('Warning');
    expect(service.toasts()[0].message).toBe('Warning message');
  });

  it('should show info toast', () => {
    const toastId = service.info('Info message', 'Info');

    expect(toastId).toBeDefined();
    expect(service.toasts().length).toBe(1);
    expect(service.infoToasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('info');
    expect(service.toasts()[0].title).toBe('Info');
    expect(service.toasts()[0].message).toBe('Info message');
  });

  it('should dismiss a toast', () => {
    const toastId = service.show({
      message: 'Test message',
      type: 'info'
    });

    expect(service.toasts().length).toBe(1);
    service.dismiss(toastId);
    expect(service.toasts().length).toBe(0);
    expect(service.hasToasts()).toBeFalse();
  });

  it('should dismiss all toasts', () => {
    service.info('Info 1');
    service.error('Error 1');
    service.warning('Warning 1');
    
    expect(service.toasts().length).toBe(3);
    service.dismissAll();
    expect(service.toasts().length).toBe(0);
    expect(service.hasToasts()).toBeFalse();
  });

  it('should dismiss toasts by type', () => {
    service.info('Info 1');
    service.error('Error 1');
    service.error('Error 2');
    service.warning('Warning 1');
    
    expect(service.toasts().length).toBe(4);
    service.dismissByType('error');
    expect(service.toasts().length).toBe(2);
    expect(service.errorToasts().length).toBe(0);
  });

  it('should auto-dismiss toast after duration', fakeAsync(() => {
    service.show({
      message: 'Auto dismiss',
      type: 'info',
      duration: 1000
    });

    expect(service.toasts().length).toBe(1);
    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should support toast with action', () => {
    const actionCallback = jasmine.createSpy('actionCallback');
    const toastId = service.show({
      message: 'Action toast',
      type: 'info',
      action: {
        label: 'Undo',
        callback: actionCallback
      }
    });

    const toast = service.toasts()[0];
    expect(toast.action).toBeDefined();
    expect(toast.action?.label).toBe('Undo');
    toast.action?.callback();
    expect(actionCallback).toHaveBeenCalled();
  });
});
