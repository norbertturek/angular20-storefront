import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { MedusaService } from './medusa.service';

@Injectable({ providedIn: 'root' })
export class RegionsService {
  private medusaService = inject(MedusaService);

  private regionsState = signal<HttpTypes.StoreRegion[]>([]);
  private regionMapState = signal<Map<string, HttpTypes.StoreRegion>>(new Map());
  private currentRegionState = signal<HttpTypes.StoreRegion | null>(null);
  private isLoadingState = signal(false);
  private errorState = signal<string | null>(null);

  public regions = computed(() => this.regionsState());
  public regionMap = computed(() => this.regionMapState());
  public currentRegion = computed(() => this.currentRegionState());
  public isLoading = computed(() => this.isLoadingState());
  public error = computed(() => this.errorState());

  constructor() {
    this.loadRegions();
  }

  private buildRegionMap(regionsData: HttpTypes.StoreRegion[]) {
    const regionMap = new Map<string, HttpTypes.StoreRegion>();
    regionsData.forEach((region) => {
      region.countries?.forEach((country) => {
        if (country.iso_2) {
          regionMap.set(country.iso_2, region);
        }
      });
    });
    this.regionMapState.set(regionMap);
  }

  async loadRegions() {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      const regionsData = await this.listRegions();
      this.regionsState.set(regionsData);
      this.buildRegionMap(regionsData);
    } catch (error) {
      this.errorState.set('Failed to load regions');
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async listRegions(): Promise<HttpTypes.StoreRegion[]> {
    try {
      const response = await this.medusaService.fetch<{ regions: HttpTypes.StoreRegion[] }>('/store/regions');
      return response.regions;
    } catch (error) {
      return [];
    }
  }

  async loadRegion(id: string): Promise<HttpTypes.StoreRegion | null> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      const response = await this.medusaService.fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`);
      this.currentRegionState.set(response.region);
      return response.region;
    } catch (error) {
      this.errorState.set('Failed to load region');
      this.currentRegionState.set(null);
      return null;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadRegionByCountry(countryCode?: string): Promise<HttpTypes.StoreRegion | null> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      const currentRegionMap = this.regionMapState();
      if (currentRegionMap.size === 0) {
        await this.loadRegions();
        const updatedMap = this.regionMapState();
        const regionsData = Array.from(updatedMap.values());
        const firstRegion = regionsData.length > 0 ? regionsData[0] : null;
        const region = countryCode ? updatedMap.get(countryCode) || firstRegion : firstRegion;
        this.currentRegionState.set(region);
        return region;
      }
      const regionsData = Array.from(currentRegionMap.values());
      const firstRegion = regionsData.length > 0 ? regionsData[0] : null;
      const region = countryCode ? currentRegionMap.get(countryCode) || firstRegion : firstRegion;
      this.currentRegionState.set(region);
      return region;
    } catch (error) {
      this.errorState.set('Failed to load region');
      this.currentRegionState.set(null);
      return null;
    } finally {
      this.isLoadingState.set(false);
    }
  }

  async loadCountryOptions(): Promise<{ country: string; region: string; label: string }[]> {
    try {
      this.isLoadingState.set(true);
      this.errorState.set(null);
      const regionsData = this.regionsState();
      const options: { country: string; region: string; label: string }[] = [];
      regionsData.forEach(region => {
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
    } catch (error) {
      this.errorState.set('Failed to load country options');
      return [];
    } finally {
      this.isLoadingState.set(false);
    }
  }
} 