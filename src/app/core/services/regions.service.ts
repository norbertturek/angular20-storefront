import { Injectable } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegionsService {
  private regionMapSubject = new BehaviorSubject<Map<string, HttpTypes.StoreRegion>>(new Map());
  private regionsSubject = new BehaviorSubject<HttpTypes.StoreRegion[]>([]);

  constructor(private medusaService: MedusaService) {
    this.loadRegions();
  }

  get regions$() {
    return this.regionsSubject.asObservable();
  }

  private async loadRegions() {
    try {
      const regions = await this.listRegions();
      this.regionsSubject.next(regions);
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

    this.regionMapSubject.next(regionMap);
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
      const regionMap = this.regionMapSubject.value;
      
      if (regionMap.size === 0) {
        // If map is empty, load regions first
        await this.loadRegions();
        const updatedMap = this.regionMapSubject.value;
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

  getRegionObservable(countryCode?: string): Observable<HttpTypes.StoreRegion | null> {
    return from(this.getRegion(countryCode));
  }

  getCountryOptions(): Observable<{ country: string; region: string; label: string }[]> {
    return this.regions$.pipe(
      map(regions => {
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
      })
    );
  }
} 