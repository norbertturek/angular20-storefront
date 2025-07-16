import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@services/toast.service';

export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  addresses?: any[];
  created_at?: string;
  updated_at?: string;
}

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
  customer?: Customer;
  token?: string;
  redirectUrl?: string;
  error?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  // Klucze do localStorage
  private static readonly STORAGE_TOKEN_KEY = 'auth_token';
  private static readonly STORAGE_CUSTOMER_KEY = 'auth_customer';

  // Inicjalizacja signals z localStorage
  private initialToken = typeof window !== 'undefined' ? localStorage.getItem(AuthService.STORAGE_TOKEN_KEY) : null;
  private initialCustomer = typeof window !== 'undefined' ? localStorage.getItem(AuthService.STORAGE_CUSTOMER_KEY) : null;

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  customer = signal<Customer | null>(this.initialCustomer ? JSON.parse(this.initialCustomer) : null);
  token = signal<string | null>(this.initialToken);

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return this.customer() !== null && this.token() !== null;
  }

  // Getter for token
  getToken(): string | null {
    return this.token();
  }

  private persistAuth(customer: Customer, token: string | null): void {
    if (typeof window === 'undefined') return;
    if (customer && token) {
      localStorage.setItem(AuthService.STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
      localStorage.setItem(AuthService.STORAGE_TOKEN_KEY, token);
    }
  }

  private clearPersistedAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AuthService.STORAGE_CUSTOMER_KEY);
    localStorage.removeItem(AuthService.STORAGE_TOKEN_KEY);
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.customer.set(null);
    this.token.set(null);
    this.clearPersistedAuth();

    try {
      const data: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(
          '/api/auth/register',
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      if (!data.success) {
        this.error.set(data.error || 'Registration failed.');
        this.success.set(false);
        this.toastService.error(data.error || 'Registration failed.', 'Registration Error');
        return data;
      }
      
      this.customer.set(data.customer || null);
      this.token.set(data.token || null);
      if (data.customer && data.token) {
        this.persistAuth(data.customer, data.token);
      }
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
    this.clearPersistedAuth();

    try {
      const data: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(
          '/api/auth/login',
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      if (!data.success) {
        this.error.set(data.error || data.message || 'Login failed.');
        this.success.set(false);
        this.toastService.error(data.error || data.message || 'Login failed.', 'Login Error');
        return data;
      }
      
      this.customer.set(data.customer || null);
      this.token.set(data.token || null);
      if (data.customer && data.token) {
        this.persistAuth(data.customer, data.token);
      }
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
    this.clearPersistedAuth();
    this.toastService.info(`Goodbye, ${customerName}! You have been logged out.`, 'Logged Out');
  }

  // Umożliwia guardowi przywrócenie signals z localStorage jeśli są puste
  public restoreFromStorageIfNeeded(): void {
    if (typeof window === 'undefined') return;
    if (!this.token() && localStorage.getItem(AuthService.STORAGE_TOKEN_KEY)) {
      this.token.set(localStorage.getItem(AuthService.STORAGE_TOKEN_KEY));
    }
    if (!this.customer() && localStorage.getItem(AuthService.STORAGE_CUSTOMER_KEY)) {
      try {
        const customerData = JSON.parse(localStorage.getItem(AuthService.STORAGE_CUSTOMER_KEY)!);
        this.customer.set(customerData);
      } catch {}
    }
  }

  // Metoda do aktualizacji danych customer
  public updateCustomer(customerData: Customer): void {
    this.customer.set(customerData);
    this.persistAuth(customerData, this.token());
  }
} 