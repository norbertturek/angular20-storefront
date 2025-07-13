import { InjectionToken, inject } from '@angular/core';
import { environment } from '@environments/environment';
import Medusa from '@medusajs/js-sdk';

export interface MedusaService {
  client: Medusa['client'];
  store: Medusa['store'];
  admin: Medusa['admin'];
  fetch: <T>(endpoint: string, options?: {
    method?: string;
    query?: Record<string, any>;
    body?: any;
  }) => Promise<T>;
}

export function createMedusaService(): MedusaService {
  const sdk = new Medusa({
    baseUrl: environment.medusaBackendUrl,
    debug: !environment.production,
    publishableKey: environment.medusaPublishableKey
  });

  // Get auth headers (for now empty, but ready for future auth implementation)
  function getAuthHeaders(): Record<string, string> {
    // TODO: Implement authentication headers when needed
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   return { authorization: `Bearer ${token}` };
    // }
    return {};
  }

  // Helper method for custom API calls
  async function medusaFetch<T>(endpoint: string, options?: {
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
    const response = await globalThis.fetch(url.toString(), {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': environment.medusaPublishableKey,
        ...(options?.body && { 'Content-Type': 'application/json' })
      },
      ...(options?.body && { body: JSON.stringify(options.body) })
    });
    if (!(response instanceof Response)) {
      throw new Error('Unexpected response type');
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  return {
    get client() {
      return sdk.client;
    },
    get store() {
      return sdk.store;
    },
    get admin() {
      return sdk.admin;
    },
    fetch: medusaFetch
  };
}

export function injectMedusaService(): MedusaService {
  return inject(MEDUSA_SERVICE);
}

export const MEDUSA_SERVICE = new InjectionToken<MedusaService>('MedusaService'); 