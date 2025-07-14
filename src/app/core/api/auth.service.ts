import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';


export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  customer = signal<any | null>(null);

  async register(payload: RegisterPayload): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.customer.set(null);

    try {
      const data: any = await this.http.post(
        '/api/auth/register',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      if (!data.success) {
        this.error.set(data.error || 'Registration failed.');
        this.success.set(false);
        return;
      }
      this.customer.set(data.customer);
      this.success.set(true);
    } catch (err: any) {
      this.error.set(err?.message || 'Registration failed.');
      this.success.set(false);
    } finally {
      this.loading.set(false);
    }
  }
} 