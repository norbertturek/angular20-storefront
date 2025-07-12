import { Injectable, signal } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegionsService {
  private regionsSignal = signal<HttpTypes.StoreRegion[]>([]);
  private regionMapSignal = signal<Map<string, HttpTypes.StoreRegion>>(new Map());

  // Expose as readonly signals
  regions = this.regionsSignal.asReadonly();
  regionMap = this.regionMapSignal.asReadonly();

  constructor(private medusaService: MedusaService) {
    this.loadRegions();
  }

  // Legacy Observable getter for backward compatibility
  get regions$() {
    return from(this.regions());
  }

  private async loadRegions() {
    try {
      const regions = await this.listRegions();
      this.regionsSignal.set(regions);
      this.buildRegionMap(regions);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  }

  private buildRegionMap(regions: HttpTypes.StoreRegion[]) {
    const regionMap = new Map<string, HttpTypes.StoreRegion>();
    
    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        if (country.iso_2) {
          regionMap.set(country.iso_2, region);
        }
      });
    });

    this.regionMapSignal.set(regionMap);
  }

  async listRegions(): Promise<HttpTypes.StoreRegion[]> {
    try {
      const response = await this.medusaService.fetch<{ regions: HttpTypes.StoreRegion[] }>('/store/regions');
      return response.regions;
    } catch (error) {
      console.error('Error fetching regions:', error);
      return [];
    }
  }

  async retrieveRegion(id: string): Promise<HttpTypes.StoreRegion | null> {
    try {
      const response = await this.medusaService.fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`);
      return response.region;
    } catch (error) {
      console.error('Error retrieving region:', error);
      return null;
    }
  }

  async getRegion(countryCode?: string): Promise<HttpTypes.StoreRegion | null> {
    try {
      const regionMap = this.regionMapSignal();
      
      if (regionMap.size === 0) {
        // If map is empty, load regions first
        await this.loadRegions();
        const updatedMap = this.regionMapSignal();
        const regions = Array.from(updatedMap.values());
        const firstRegion = regions.length > 0 ? regions[0] : null;
        return countryCode ? updatedMap.get(countryCode) || firstRegion : firstRegion;
      }

      const regions = Array.from(regionMap.values());
      const firstRegion = regions.length > 0 ? regions[0] : null;
      return countryCode ? regionMap.get(countryCode) || firstRegion : firstRegion;
    } catch (error) {
      console.error('Error getting region:', error);
      return null;
    }
  }

  // Legacy Observable method for backward compatibility
  getRegionObservable(countryCode?: string): Observable<HttpTypes.StoreRegion | null> {
    return from(this.getRegion(countryCode));
  }

  // Legacy Observable method for backward compatibility
  getCountryOptions(): Observable<{ country: string; region: string; label: string }[]> {
    return from(this.getCountryOptionsAsync());
  }

  // New async method using signals
  async getCountryOptionsAsync(): Promise<{ country: string; region: string; label: string }[]> {
    const regions = this.regionsSignal();
    const options: { country: string; region: string; label: string }[] = [];
    
    regions.forEach(region => {
      region.countries?.forEach(country => {
        if (country.iso_2 && country.display_name) {
          options.push({
            country: country.iso_2,
            region: region.id,
            label: country.display_name
          });
        }
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }
} 