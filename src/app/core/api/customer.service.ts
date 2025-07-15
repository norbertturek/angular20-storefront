import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from '@services/toast.service';

export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  addresses?: any[];
  created_at: string;
  updated_at: string;
}

export interface UpdateCustomerPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface Order {
  id: string;
  display_id: number;
  status: string;
  total: number;
  currency_code: string;
  created_at: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface CustomerResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
}

export interface OrdersResponse {
  success: boolean;
  orders?: Order[];
  count?: number;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);

  async updateCustomer(payload: UpdateCustomerPayload): Promise<CustomerResponse> {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.token();
    if (!token) {
      const errorMessage = 'No authentication token available.';
      this.error.set(errorMessage);
      this.loading.set(false);
      this.toastService.error(errorMessage, 'Authentication Error');
      return { success: false, error: errorMessage };
    }

    try {
      const data: CustomerResponse = await this.http.post(
        '/api/customer/update',
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      ).toPromise() as CustomerResponse;

      if (!data.success) {
        this.error.set(data.error || 'Failed to update customer.');
        this.toastService.error(data.error || 'Failed to update customer.', 'Update Error');
        return data;
      }
      
      this.toastService.success('Profile updated successfully!', 'Profile Updated');
      return data;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to update customer.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Update Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async getOrders(limit: number = 10, offset: number = 0): Promise<OrdersResponse> {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.token();
    if (!token) {
      const errorMessage = 'No authentication token available.';
      this.error.set(errorMessage);
      this.loading.set(false);
      this.toastService.error(errorMessage, 'Authentication Error');
      return { success: false, error: errorMessage };
    }

    try {
      const data: OrdersResponse = await this.http.get(
        `/api/customer/orders?limit=${limit}&offset=${offset}`,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      ).toPromise() as OrdersResponse;

      if (!data.success) {
        this.error.set(data.error || 'Failed to fetch orders.');
        this.toastService.error(data.error || 'Failed to fetch orders.', 'Orders Error');
        return data;
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to fetch orders.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Orders Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.http.post(
        '/api/customer/password-reset',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise() as any;

      if (!data.success) {
        this.error.set(data.error || 'Failed to send password reset email.');
        this.toastService.error(data.error || 'Failed to send password reset email.', 'Password Reset Error');
        return { success: false, error: data.error };
      }
      
      this.toastService.success('Password reset email sent! Check your inbox.', 'Password Reset Sent');
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to send password reset email.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Password Reset Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }
} 