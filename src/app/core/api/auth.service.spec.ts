import { TestBed } from '@angular/core/testing';
import { AuthService, RegisterPayload } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpClientSpy },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register successfully', async () => {
    const payload: RegisterPayload = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      password: 'password',
    };
    const response = { success: true, customer: { id: 1, email: payload.email } };
    httpClientSpy.post.and.returnValue(of(response));

    await service.register(payload);

    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.success()).toBeTrue();
    expect(service.customer()).toEqual(response.customer);
  });

  it('should handle registration error from API', async () => {
    const payload: RegisterPayload = {
      email: 'fail@example.com',
      first_name: 'Fail',
      last_name: 'User',
      password: 'password',
    };
    const response = { success: false, error: 'Email exists' };
    httpClientSpy.post.and.returnValue(of(response));

    await service.register(payload);

    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('Email exists');
    expect(service.success()).toBeFalse();
    expect(service.customer()).toBeNull();
  });

  it('should handle HTTP error', async () => {
    const payload: RegisterPayload = {
      email: 'error@example.com',
      first_name: 'Error',
      last_name: 'User',
      password: 'password',
    };
    httpClientSpy.post.and.returnValue(throwError(() => new Error('Network error')));

    await service.register(payload);

    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('Network error');
    expect(service.success()).toBeFalse();
    expect(service.customer()).toBeNull();
  });
}); 