import { inject, signal, computed, InjectionToken } from '@angular/core';
import { HttpTypes } from '@medusajs/types';
import { injectMedusaService } from './medusa.service';

export interface RegionsService {
  regions: ReturnType<typeof computed<HttpTypes.StoreRegion[]>>;
  regionMap: ReturnType<typeof computed<Map<string, HttpTypes.StoreRegion>>>;
  currentRegion: ReturnType<typeof computed<HttpTypes.StoreRegion | null>>;
  isLoading: ReturnType<typeof computed<boolean>>;
  error: ReturnType<typeof computed<string | null>>;
  listRegions: () => Promise<HttpTypes.StoreRegion[]>;
  loadRegion: (id: string) => Promise<HttpTypes.StoreRegion | null>;
  loadRegionByCountry: (countryCode?: string) => Promise<HttpTypes.StoreRegion | null>;
  loadCountryOptions: () => Promise<{ country: string; region: string; label: string }[]>;
}

export function createRegionsService(): RegionsService {
  const medusaService = injectMedusaService();

  // Signal-based state
  const regionsState = signal<HttpTypes.StoreRegion[]>([]);
  const regionMapState = signal<Map<string, HttpTypes.StoreRegion>>(new Map());
  const currentRegionState = signal<HttpTypes.StoreRegion | null>(null);
  const isLoadingState = signal(false);
  const errorState = signal<string | null>(null);

  // Public signals
  const regions = computed(() => regionsState());
  const regionMap = computed(() => regionMapState());
  const currentRegion = computed(() => currentRegionState());
  const isLoading = computed(() => isLoadingState());
  const error = computed(() => errorState());

  function buildRegionMap(regionsData: HttpTypes.StoreRegion[]) {
    const regionMap = new Map<string, HttpTypes.StoreRegion>();
    
    regionsData.forEach((region) => {
      region.countries?.forEach((country) => {
        if (country.iso_2) {
          regionMap.set(country.iso_2, region);
        }
      });
    });

    regionMapState.set(regionMap);
  }

  async function loadRegions() {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      const regionsData = await listRegions();
      regionsState.set(regionsData);
      buildRegionMap(regionsData);
    } catch (error) {
      errorState.set('Failed to load regions');
    } finally {
      isLoadingState.set(false);
    }
  }

  async function listRegions(): Promise<HttpTypes.StoreRegion[]> {
    try {
      const response = await medusaService.fetch<{ regions: HttpTypes.StoreRegion[] }>('/store/regions');
      return response.regions;
    } catch (error) {
      return [];
    }
  }

  async function loadRegion(id: string): Promise<HttpTypes.StoreRegion | null> {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      const response = await medusaService.fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`);
      
      currentRegionState.set(response.region);
      return response.region;
    } catch (error) {
      errorState.set('Failed to load region');
      currentRegionState.set(null);
      return null;
    } finally {
      isLoadingState.set(false);
    }
  }

  async function loadRegionByCountry(countryCode?: string): Promise<HttpTypes.StoreRegion | null> {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      const currentRegionMap = regionMapState();
      
      if (currentRegionMap.size === 0) {
        // If map is empty, load regions first
        await loadRegions();
        const updatedMap = regionMapState();
        const regionsData = Array.from(updatedMap.values());
        const firstRegion = regionsData.length > 0 ? regionsData[0] : null;
        const region = countryCode ? updatedMap.get(countryCode) || firstRegion : firstRegion;
        
        currentRegionState.set(region);
        return region;
      }

      const regionsData = Array.from(currentRegionMap.values());
      const firstRegion = regionsData.length > 0 ? regionsData[0] : null;
      const region = countryCode ? currentRegionMap.get(countryCode) || firstRegion : firstRegion;
      
      currentRegionState.set(region);
      return region;
    } catch (error) {
      errorState.set('Failed to load region');
      currentRegionState.set(null);
      return null;
    } finally {
      isLoadingState.set(false);
    }
  }

  async function loadCountryOptions(): Promise<{ country: string; region: string; label: string }[]> {
    try {
      isLoadingState.set(true);
      errorState.set(null);

      const regionsData = regionsState();
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
      errorState.set('Failed to load country options');
      return [];
    } finally {
      isLoadingState.set(false);
    }
  }

  // Initialize regions on service creation
  loadRegions();

  return {
    regions,
    regionMap,
    currentRegion,
    isLoading,
    error,
    listRegions,
    loadRegion,
    loadRegionByCountry,
    loadCountryOptions
  };
}

export function injectRegionsService(): RegionsService {
  return inject(REGIONS_SERVICE);
}

export const REGIONS_SERVICE = new InjectionToken<RegionsService>('RegionsService'); 