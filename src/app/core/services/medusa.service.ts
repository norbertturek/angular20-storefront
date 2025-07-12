import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import Medusa from '@medusajs/js-sdk';

@Injectable({
  providedIn: 'root'
})
export class MedusaService {
  private sdk: Medusa;

  constructor() {
    this.sdk = new Medusa({
      baseUrl: environment.medusaBackendUrl,
      debug: !environment.production,
      publishableKey: environment.medusaPublishableKey
    });
  }

  get client() {
    return this.sdk.client;
  }

  get store() {
    return this.sdk.store;
  }

  // Get auth headers (for now empty, but ready for future auth implementation)
  private getAuthHeaders(): Record<string, string> {
    // TODO: Implement authentication headers when needed
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   return { authorization: `Bearer ${token}` };
    // }
    return {};
  }

  get admin() {
    return this.sdk.admin;
  }

  // Helper method for custom API calls
  async fetch<T>(endpoint: string, options?: {
    method?: string;
    query?: Record<string, any>;
    body?: any;
  }): Promise<T> {
    const url = new URL(endpoint, environment.medusaBackendUrl);
    
    if (options?.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, v));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': environment.medusaPublishableKey,
        ...(options?.body && { 'Content-Type': 'application/json' })
      },
      ...(options?.body && { body: JSON.stringify(options.body) })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
} 