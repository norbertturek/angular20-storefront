import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';
import Medusa from '@medusajs/js-sdk';

@Injectable({ providedIn: 'root' })
export class MedusaService {
  private sdk = new Medusa({
    baseUrl: environment.medusaBackendUrl,
    debug: !environment.production,
    publishableKey: environment.medusaPublishableKey
  });

  get client() {
    return this.sdk.client;
  }

  get store() {
    return this.sdk.store;
  }

  get admin() {
    return this.sdk.admin;
  }

  get auth() {
    return this.sdk.auth;
  }

  // Helper method for custom API calls
  async fetch<T>(endpoint: string, options?: {
    method?: string;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
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
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': environment.medusaPublishableKey,
      ...options?.headers
    };

    const response = await globalThis.fetch(url.toString(), {
      method: options?.method || 'GET',
      headers,
      ...(options?.body && { body: JSON.stringify(options.body) })
    });
    
    if (!(response instanceof Response)) {
      throw new Error('Unexpected response type');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response.json();
  }
} 