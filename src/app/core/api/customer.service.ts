import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService, Customer } from './auth.service';
import { ToastService } from '@services/toast.service';

export interface UpdateCustomerPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface AddressPayload {
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  postal_code: string;
  province?: string;
  phone?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
}

export interface CustomerResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
}

export interface AddressResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
  message?: string;
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
      const data = await firstValueFrom(this.http.post<CustomerResponse>(
        '/api/customer/update',
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      ));

      if (!data?.success) {
        this.error.set(data?.error || 'Failed to update customer.');
        this.toastService.error(data?.error || 'Failed to update customer.', 'Update Error');
        return data!;
      }
      
      this.toastService.success('Profile updated successfully!', 'Profile Updated');
      return data!;
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
      const data = await firstValueFrom(this.http.get<OrdersResponse>(
        `/api/customer/orders?limit=${limit}&offset=${offset}`,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      ));

      if (!data?.success) {
        this.error.set(data?.error || 'Failed to fetch orders.');
        this.toastService.error(data?.error || 'Failed to fetch orders.', 'Orders Error');
        return data!;
      }
      
      return data!;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to fetch orders.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Orders Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async requestPasswordReset(email: string): Promise<CustomerResponse> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await firstValueFrom(this.http.post<CustomerResponse>(
        '/api/customer/password-reset',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      ));

      if (!data?.success) {
        this.error.set(data?.error || 'Failed to request password reset.');
        this.toastService.error(data?.error || 'Failed to request password reset.', 'Password Reset Error');
        return data!;
      }
      
      this.toastService.success('Password reset email sent! Check your inbox.', 'Password Reset Sent');
      return data!;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to request password reset.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Password Reset Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async addAddress(payload: AddressPayload): Promise<AddressResponse> {
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
      const data = await firstValueFrom(this.http.post<AddressResponse>(
        '/api/customer/addresses',
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      ));

      if (!data?.success) {
        this.error.set(data?.error || 'Failed to add address.');
        this.toastService.error(data?.error || 'Failed to add address.', 'Add Address Error');
        return data!;
      }
      
      this.toastService.success('Address added successfully!', 'Address Added');
      return data!;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to add address.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Add Address Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async updateAddress(addressId: string, payload: AddressPayload): Promise<AddressResponse> {
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
      const data = await firstValueFrom(this.http.put<AddressResponse>(
        `/api/customer/addresses/${addressId}`,
        payload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        }
      ));

      if (!data?.success) {
        this.error.set(data?.error || 'Failed to update address.');
        this.toastService.error(data?.error || 'Failed to update address.', 'Update Address Error');
        return data!;
      }
      
      this.toastService.success('Address updated successfully!', 'Address Updated');
      return data!;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to update address.';
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Update Address Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }

  async deleteAddress(addressId: string): Promise<AddressResponse> {
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
      const data = await firstValueFrom(this.http.delete<AddressResponse>(
        `/api/customer/addresses/${addressId}`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`
          } 
        }
      ));

      if (!data?.success) {
        this.error.set(data?.error || 'Failed to delete address.');
        this.toastService.error(data?.error || 'Failed to delete address.', 'Delete Address Error');
        return data!;
      }
      
      this.toastService.success('Address deleted successfully!', 'Address Deleted');
      return data!;
    } catch (err: any) {
      const errorMessage = err?.error?.details || err?.message || 'Failed to delete address.';
      
      // Check if the error indicates the address was already deleted
      if (errorMessage.includes('not found') || errorMessage.includes('already deleted')) {
        // This is actually a success case - the address was deleted
        this.toastService.success('Address deleted successfully!', 'Address Deleted');
        return { success: true };
      }
      
      this.error.set(errorMessage);
      this.toastService.error(errorMessage, 'Delete Address Error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading.set(false);
    }
  }
} 