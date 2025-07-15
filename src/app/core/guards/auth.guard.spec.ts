import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@api/auth.service';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceMock: any;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = {
      customer: signal(null)
    };
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should return true when customer is authenticated', () => {
    const mockCustomer = { id: '1', email: 'test@example.com' };
    authServiceMock.customer = signal(mockCustomer);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login and return false when customer is not authenticated', () => {
    authServiceMock.customer = signal(null);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login and return false when customer is undefined', () => {
    authServiceMock.customer = signal(undefined);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
}); 