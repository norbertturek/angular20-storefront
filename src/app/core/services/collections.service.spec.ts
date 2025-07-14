import { TestBed } from '@angular/core/testing';
import { CollectionsService } from './collections.service';
import { MedusaService } from '@api/medusa.service';
import { ProductsService } from '@features/products/products.service';
import { HttpTypes } from '@medusajs/types';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let medusaServiceMock: any;
  let productsServiceMock: any;

  const mockCollections: HttpTypes.StoreCollection[] = [
    {
      id: 'c1',
      title: 'Col1',
      metadata: { image: { url: '/img/c1.png' }, product_page_image: { url: '/img/pp1.png' }, product_page_wide_image: { url: '/img/wide1.png' } },
    } as any,
    {
      id: 'c2',
      title: 'Col2',
      metadata: {},
    } as any,
  ];

  beforeEach(() => {
    medusaServiceMock = {
      fetch: jasmine.createSpy('fetch').and.callFake((url: string, opts: any) => {
        if (url === '/store/collections') {
          return Promise.resolve({ collections: mockCollections, count: mockCollections.length });
        }
        if (url.startsWith('/store/collections/')) {
          const id = url.split('/').pop();
          const collection = mockCollections.find(c => c.id === id);
          return Promise.resolve({ collection });
        }
        return Promise.resolve({});
      })
    };
    productsServiceMock = {
      loadProducts: jasmine.createSpy('loadProducts').and.returnValue(Promise.resolve({ products: [{ id: 'p1', collection_id: 'c1' }] }))
    };
    TestBed.configureTestingModule({
      providers: [
        CollectionsService,
        { provide: MedusaService, useValue: medusaServiceMock },
        { provide: ProductsService, useValue: productsServiceMock },
      ]
    });
    service = TestBed.inject(CollectionsService);
  });

  it('should load collections', async () => {
    await service.loadCollections();
    expect(service.collections().length).toBe(2);
    expect(service.count()).toBe(2);
  });

  it('should load collection by id', async () => {
    await service.loadCollection('c1');
    expect(service.collections()[0].id).toBe('c1');
  });

  it('should load collection by handle', async () => {
    await service.loadCollectionByHandle('Col1');
    expect(service.collections().length).toBe(2);
  });

  it('should load collections with products', async () => {
    await service.loadCollectionsWithProducts();
    expect(productsServiceMock.loadProducts).toHaveBeenCalled();
    expect(service.collections()[0].products?.length ?? 0).toBeGreaterThan(0);
  });

  it('should get collection image url', () => {
    expect(service.getCollectionImageUrl(mockCollections[0])).toBe('/img/c1.png');
    expect(service.getCollectionImageUrl(mockCollections[1])).toBeNull();
  });

  it('should check if collection has image', () => {
    expect(service.hasCollectionImage(mockCollections[0])).toBeTrue();
    expect(service.hasCollectionImage(mockCollections[1])).toBeFalse();
  });

  it('should get collection product page image', () => {
    expect(service.getCollectionProductPageImage(mockCollections[0])).toBe('/img/pp1.png');
    expect(service.getCollectionProductPageImage(mockCollections[1])).toBeNull();
  });

  it('should get collection wide image', () => {
    expect(service.getCollectionWideImage(mockCollections[0])).toBe('/img/wide1.png');
    expect(service.getCollectionWideImage(mockCollections[1])).toBeNull();
  });
}); 