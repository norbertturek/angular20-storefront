import { TestBed } from '@angular/core/testing';
import { MedusaService } from './medusa.service';

describe('MedusaService', () => {
  let service: MedusaService;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MedusaService],
    });
    service = TestBed.inject(MedusaService);
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should expose client, store, admin', () => {
    expect(service.client).toBeDefined();
    expect(service.store).toBeDefined();
    expect(service.admin).toBeDefined();
  });

  it('should fetch data successfully', async () => {
    const mockResponse = { foo: 'bar' };
    globalThis.fetch = jasmine.createSpy('fetch').and.returnValue(Promise.resolve(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    const result = await service.fetch<{ foo: string }>('/test');
    expect(result).toEqual(mockResponse);
  });

  it('should throw on HTTP error', async () => {
    globalThis.fetch = jasmine.createSpy('fetch').and.returnValue(Promise.resolve(
      new Response('', { status: 404 })
    ));
    await expectAsync(service.fetch('/fail')).toBeRejectedWithError('HTTP error! status: 404, message: ');
  });

  it('should append query params', async () => {
    let calledUrl = '';
    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((url: string) => {
      calledUrl = url;
      return Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
    await service.fetch('/test', { query: { a: 1, b: 'x' } });
    expect(calledUrl).toContain('a=1');
    expect(calledUrl).toContain('b=x');
  });
}); 