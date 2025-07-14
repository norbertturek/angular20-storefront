import { SearchService, ProductSearchResult } from './search.service';
import { TestBed } from '@angular/core/testing';
import { MedusaService } from '@api/medusa.service';
import { RegionsService } from '@api/regions.service';

describe('SearchService', () => {
  let service: SearchService;
  let medusaServiceMock: any;
  let regionsServiceMock: any;
  let injectSpy: jasmine.Spy;

  beforeEach(() => {
    medusaServiceMock = { fetch: jasmine.createSpy('fetch') };
    regionsServiceMock = { loadRegionByCountry: jasmine.createSpy('loadRegionByCountry') };
    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: MedusaService, useValue: medusaServiceMock },
        { provide: RegionsService, useValue: regionsServiceMock },
      ],
    });
    service = TestBed.inject(SearchService);
  });

  it('should initialize with empty results and not loading', () => {
    expect(service.searchResults()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should return empty array and not call searchProducts for empty query', async () => {
    const spy = spyOn<any>(service, 'searchProducts');
    const results = await service.search('');
    expect(results).toEqual([]);
    expect(service.searchResults()).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set isLoading and update results on successful search', async () => {
    const hits = [{ id: '1', handle: 'h', title: 't', thumbnail: '', variants: [] }];
    spyOn<any>(service, 'searchProducts').and.returnValue(Promise.resolve({ hits, processingTimeMs: 1, query: 'q', limit: 10, offset: 0, estimatedTotalHits: 1 }));
    spyOn<any>(service, 'enrichSearchResults').and.returnValue(Promise.resolve(hits));
    const promise = service.search('test');
    expect(service.isLoading()).toBe(true);
    const results = await promise;
    expect(service.isLoading()).toBe(false);
    expect(service.searchResults()).toEqual(hits);
    expect(results).toEqual(hits);
  });

  it('should handle error in search', async () => {
    spyOn<any>(service, 'searchProducts').and.throwError('fail');
    const results = await service.search('fail');
    expect(service.error()).toBe('Search failed');
    expect(service.searchResults()).toEqual([]);
    expect(results).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it('should debounce searchWithDebounce', async () => {
    const spy = spyOn(service, 'search').and.returnValue(Promise.resolve([{ id: '1', handle: '', title: '', thumbnail: '', variants: [] }]));
    const results = await service.searchWithDebounce('debounce');
    expect(spy).toHaveBeenCalledWith('debounce');
    expect(results.length).toBe(1);
  });
}); 