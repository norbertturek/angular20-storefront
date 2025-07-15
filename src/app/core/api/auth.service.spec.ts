import { TestBed } from '@angular/core/testing';
import { AuthService, RegisterPayload, LoginPayload } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ToastService } from '@services/toast.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;

  const mockCustomer = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
  };

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.success()).toBeFalse();
    expect(service.customer()).toBeNull();
    expect(service.token()).toBeNull();
  });

  describe('isAuthenticated', () => {
    it('should return true when customer and token are present', () => {
      service.customer.set(mockCustomer);
      service.token.set('mock-token');

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false when customer is null', () => {
      service.customer.set(null);
      service.token.set('mock-token');

      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return false when token is null', () => {
      service.customer.set(mockCustomer);
      service.token.set(null);

      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return false when both customer and token are null', () => {
      service.customer.set(null);
      service.token.set(null);

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getToken', () => {
    it('should return current token', () => {
      service.token.set('test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token', () => {
      service.token.set(null);
      expect(service.getToken()).toBeNull();
    });
  });

  describe('register', () => {
    const payload: RegisterPayload = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      password: 'password',
    };

    it('should register successfully', async () => {
      const response = { success: true, customer: mockCustomer, token: 'mock-token' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.register(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
      expect(service.success()).toBeTrue();
      expect(service.customer()).toEqual(mockCustomer);
      expect(service.token()).toBe('mock-token');
      expect(result).toEqual(response);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/api/auth/register',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(toastServiceMock.success).toHaveBeenCalledWith('Account created successfully! Welcome!', 'Registration Successful');
    });

    it('should handle registration error from API', async () => {
      const response = { success: false, error: 'Email exists' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.register(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Email exists');
      expect(service.success()).toBeFalse();
      expect(service.customer()).toBeNull();
      expect(service.token()).toBeNull();
      expect(result).toEqual(response);
      expect(toastServiceMock.error).toHaveBeenCalledWith('Email exists', 'Registration Error');
    });

    it('should handle HTTP error', async () => {
      const error = { error: { details: 'Network error' } };
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.register(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Network error');
      expect(service.success()).toBeFalse();
      expect(service.customer()).toBeNull();
      expect(service.token()).toBeNull();
      expect(result.success).toBeFalse();
      expect(result.error).toBe('Network error');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Network error', 'Registration Error');
    });

    it('should handle error without details', async () => {
      const error = { message: 'Generic error' };
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.register(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Generic error');
      expect(result.success).toBeFalse();
      expect(result.error).toBe('Generic error');
    });

    it('should handle error without message or details', async () => {
      const error = {};
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.register(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Registration failed.');
      expect(result.success).toBeFalse();
      expect(result.error).toBe('Registration failed.');
    });
  });

  describe('login', () => {
    const payload: LoginPayload = {
      email: 'test@example.com',
      password: 'password',
    };

    it('should login successfully', async () => {
      const response = { success: true, customer: mockCustomer, token: 'mock-token' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.login(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
      expect(service.success()).toBeTrue();
      expect(service.customer()).toEqual(mockCustomer);
      expect(service.token()).toBe('mock-token');
      expect(result).toEqual(response);
      expect(httpClientSpy.post).toHaveBeenCalledWith(
        '/api/auth/login',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(toastServiceMock.success).toHaveBeenCalledWith('Welcome back, Test!', 'Login Successful');
    });

    it('should handle login error from API', async () => {
      const response = { success: false, error: 'Invalid credentials' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.login(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Invalid credentials');
      expect(service.success()).toBeFalse();
      expect(service.customer()).toBeNull();
      expect(service.token()).toBeNull();
      expect(result).toEqual(response);
      expect(toastServiceMock.error).toHaveBeenCalledWith('Invalid credentials', 'Login Error');
    });

    it('should handle login error with message field', async () => {
      const response = { success: false, message: 'Account locked' };
      httpClientSpy.post.and.returnValue(of(response));

      const result = await service.login(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Account locked');
      expect(service.success()).toBeFalse();
      expect(toastServiceMock.error).toHaveBeenCalledWith('Account locked', 'Login Error');
    });

    it('should handle HTTP error during login', async () => {
      const error = { error: { details: 'Server error' } };
      httpClientSpy.post.and.returnValue(throwError(() => error));

      const result = await service.login(payload);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Server error');
      expect(service.success()).toBeFalse();
      expect(service.customer()).toBeNull();
      expect(service.token()).toBeNull();
      expect(result.success).toBeFalse();
      expect(result.error).toBe('Server error');
      expect(toastServiceMock.error).toHaveBeenCalledWith('Server error', 'Login Error');
    });

    it('should handle customer without first_name', async () => {
      const customerWithoutName = { ...mockCustomer, first_name: undefined };
      const response = { success: true, customer: customerWithoutName, token: 'mock-token' };
      httpClientSpy.post.and.returnValue(of(response));

      await service.login(payload);

      expect(toastServiceMock.success).toHaveBeenCalledWith('Welcome back, User!', 'Login Successful');
    });
  });

  describe('logout', () => {
    it('should clear all auth data and show goodbye message', () => {
      service.customer.set(mockCustomer);
      service.token.set('mock-token');
      service.success.set(true);
      service.error.set('some error');

      service.logout();

      expect(service.customer()).toBeNull();
      expect(service.token()).toBeNull();
      expect(service.success()).toBeFalse();
      expect(service.error()).toBeNull();
      expect(toastServiceMock.info).toHaveBeenCalledWith('Goodbye, Test! You have been logged out.', 'Logged Out');
    });

    it('should handle logout when customer has no first_name', () => {
      const customerWithoutName = { ...mockCustomer, first_name: undefined };
      service.customer.set(customerWithoutName);
      service.token.set('mock-token');

      service.logout();

      expect(toastServiceMock.info).toHaveBeenCalledWith('Goodbye, User! You have been logged out.', 'Logged Out');
    });
  });
}); 