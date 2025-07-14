import { TestBed } from '@angular/core/testing';
import { RegionsService } from './regions.service';
import { MedusaService } from './medusa.service';
import { HttpTypes } from '@medusajs/types';

describe('RegionsService', () => {
  let service: RegionsService;
  let medusaServiceMock: any;

  const mockRegions: HttpTypes.StoreRegion[] = [
    {
      id: 'r1',
      name: 'Region 1',
      countries: [
        { iso_2: 'pl', display_name: 'Poland' },
        { iso_2: 'de', display_name: 'Germany' },
      ],
    } as any,
    {
      id: 'r2',
      name: 'Region 2',
      countries: [
        { iso_2: 'us', display_name: 'USA' },
      ],
    } as any,
  ];

  beforeEach(() => {
    medusaServiceMock = {
      fetch: jasmine.createSpy('fetch').and.callFake((url: string) => {
        if (url === '/store/regions') {
          return Promise.resolve({ regions: mockRegions });
        }
        if (url.startsWith('/store/regions/')) {
          const id = url.split('/').pop();
          const region = mockRegions.find(r => r.id === id);
          return Promise.resolve({ region });
        }
        return Promise.resolve({});
      })
    };
    TestBed.configureTestingModule({
      providers: [
        RegionsService,
        { provide: MedusaService, useValue: medusaServiceMock },
      ]
    });
    service = TestBed.inject(RegionsService);
  });

  it('should initialize and load regions', async () => {
    await new Promise(r => setTimeout(r, 10)); // wait for loadRegions
    expect(service.regions().length).toBe(2);
    expect(service.regionMap().get('pl')).toBeDefined();
    expect(service.regionMap().get('us')).toBeDefined();
  });

  it('should list regions', async () => {
    const regions = await service.listRegions();
    expect(regions.length).toBe(2);
    expect(medusaServiceMock.fetch).toHaveBeenCalledWith('/store/regions');
  });

  it('should load region by id', async () => {
    const region = await service.loadRegion('r1');
    expect(region?.id).toBe('r1');
    expect(service.currentRegion()?.id).toBe('r1');
  });

  it('should load region by country', async () => {
    await new Promise(r => setTimeout(r, 10));
    const region = await service.loadRegionByCountry('pl');
    expect(region?.id).toBe('r1');
    expect(service.currentRegion()?.id).toBe('r1');
  });

  it('should load country options', async () => {
    await new Promise(r => setTimeout(r, 10));
    const options = await service.loadCountryOptions();
    expect(options.some(o => o.country === 'pl')).toBeTrue();
    expect(options.some(o => o.country === 'us')).toBeTrue();
    expect(options.every(o => o.label)).toBeTrue();
  });
}); 