import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { CustomerService, UpdateCustomerPayload, Customer, Order } from './customer.service';
import { AuthService } from './auth.service';
import { ToastService } from '@services/toast.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let authServiceMock: any;
  let toastServiceMock: jasmine.SpyObj<ToastService>;

  const mockCustomer: Customer = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    addresses: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockOrder: Order = {
    id: 'order1',
    display_id: 1,
    status: 'pending',
    total: 10000,
    currency_code: 'usd',
    created_at: '2024-01-01T00:00:00Z',
    items: [
      {
        id: 'item1',
        title: 'Test Product',
        quantity: 1,
        unit_price: 10000
      }
    ]
  };

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post', 'get']);
    authServiceMock = {
      token: signal('mock-token')
    };
    toastServiceMock = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        CustomerService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    });
    service = TestBed.inject(CustomerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with not loading and no error', () => {
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  describe('updateCustomer', () => {
    const updatePayload: UpdateCustomerPayload = {
      first_name: 'Updated',
      last_name: 'Name',
      phone: '+9876543210'
    };

    it('should update customer successfully', async () => {
      const response = { success: true, customer: mockCustomer };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.updateCustomer(updatePayload);

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(result.success).toBe(true);
      expect(result.customer).toEqual(mockCustomer);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/api/customer/update',
        updatePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(toastServiceMock.success).toHaveBeenCalledWith('Profile updated successfully!', 'Profile Updated');
    });

    it('should handle API error response', async () => {
      const response = { success: false, error: 'Update failed' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.updateCustomer(updatePayload);

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Update failed');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Update failed', 'Update Error');
    });

    it('should handle HTTP error', async () => {
      const error = { error: { details: 'Network error' } };
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.updateCustomer(updatePayload);

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Network error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Network error', 'Update Error');
    });

    it('should handle missing authentication token', async () => {
      authServiceMock.token = signal(null);

      const result = await service.updateCustomer(updatePayload);

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('No authentication token available.');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No authentication token available.');
      expect(toastServiceMock.error).toHaveBeenCalledWith('No authentication token available.', 'Authentication Error');
      expect(httpClientSpy.post).not.toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should fetch orders successfully', async () => {
      const response = { success: true, orders: [mockOrder], count: 1 };
      httpClientSpy.get.and.returnValue(of(response));

      const result = await service.getOrders(10, 0);

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(result.success).toBe(true);
      expect(result.orders).toEqual([mockOrder]);
      expect(result.count).toBe(1);
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/api/customer/orders?limit=10&offset=0',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
    });

    it('should handle API error response for orders', async () => {
      const response = { success: false, error: 'Failed to fetch orders' };
      httpClientSpy.get.and.returnValue(of(response));

      const result = await service.getOrders();

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Failed to fetch orders');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch orders');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Failed to fetch orders', 'Orders Error');
    });

    it('should handle HTTP error for orders', async () => {
      const error = { message: 'Network error' };
      httpClientSpy.get.and.returnValue(throwError(() => error));

      const result = await service.getOrders();

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Network error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Network error', 'Orders Error');
    });

    it('should handle missing authentication token for orders', async () => {
      authServiceMock.token = signal(null);

      const result = await service.getOrders();

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('No authentication token available.');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No authentication token available.');
      expect(toastServiceMock.error).toHaveBeenCalledWith('No authentication token available.', 'Authentication Error');
      expect(httpClientSpy.get).not.toHaveBeenCalled();
    });

    it('should use default parameters when not provided', async () => {
      const response = { success: true, orders: [], count: 0 };
      httpClientSpy.get.and.returnValue(of(response));

      await service.getOrders();

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        '/api/customer/orders?limit=10&offset=0',
        jasmine.any(Object)
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const response = { success: true };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.requestPasswordReset('test@example.com');

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(result.success).toBe(true);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/api/customer/password-reset',
        { email: 'test@example.com' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(toastServiceMock.success).toHaveBeenCalledWith('Password reset email sent! Check your inbox.', 'Password Reset Sent');
    });

    it('should handle API error response for password reset', async () => {
      const response = { success: false, error: 'Email not found' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.requestPasswordReset('nonexistent@example.com');

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Email not found');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email not found');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Email not found', 'Password Reset Error');
    });

    it('should handle HTTP error for password reset', async () => {
      const error = { error: { details: 'Server error' } };
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.requestPasswordReset('test@example.com');

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Server error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Server error', 'Password Reset Error');
    });

    it('should handle generic error message when details not available', async () => {
      const error = { message: 'Generic error' };
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.requestPasswordReset('test@example.com');

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Generic error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Generic error');
    });

    it('should handle error without message or details', async () => {
      const error = {};
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.requestPasswordReset('test@example.com');

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Failed to send password reset email.');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send password reset email.');
    });
  });
}); 