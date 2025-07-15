import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ToastService } from '@services/toast.service';

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  customer?: any;
  token?: string;
  redirectUrl?: string;
  error?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  customer = signal<any | null>(null);
  token = signal<string | null>(null);

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return this.customer() !== null && this.token() !== null;
  }

  // Getter for token
  getToken(): string | null {
    return this.token();
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.customer.set(null);
    this.token.set(null);

    try {
      const data: AuthResponse = await this.http.post(
        '/api/auth/register',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise() as AuthResponse;

      if (!data.success) {
        this.error.set(data.error || 'Registration failed.');
        this.success.set(false);
        this.toastService.error(data.error || 'Registration failed.', 'Registration Error');
        return data;
      }
      
      this.customer.set(data.customer);
      this.token.set(data.token || null);
      this.success.set(true);
      this.toastService.success('Account created successfully! Welcome!', 'Registration Successful');
      return data;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Registration failed.';
      this.error.set(errorMessage);
      this.success.set(false);
      this.toastService.error(errorMessage, 'Registration Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.customer.set(null);
    this.token.set(null);

    try {
      const data: AuthResponse = await this.http.post(
        '/api/auth/login',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise() as AuthResponse;

      if (!data.success) {
        this.error.set(data.error || data.message || 'Login failed.');
        this.success.set(false);
        this.toastService.error(data.error || data.message || 'Login failed.', 'Login Error');
        return data;
      }
      
      this.customer.set(data.customer);
      this.token.set(data.token || null);
      this.success.set(true);
      this.toastService.success(`Welcome back, ${data.customer?.first_name || 'User'}!`, 'Login Successful');
      return data;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Login failed.';
      this.error.set(errorMessage);
      this.success.set(false);
      this.toastService.error(errorMessage, 'Login Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    const customerName = this.customer()?.first_name || 'User';
    this.customer.set(null);
    this.token.set(null);
    this.success.set(false);
    this.error.set(null);
    this.toastService.info(`Goodbye, ${customerName}! You have been logged out.`, 'Logged Out');
  }
} 