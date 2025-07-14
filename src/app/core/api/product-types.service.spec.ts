import { TestBed } from '@angular/core/testing';
import { ProductTypesService } from './product-types.service';
import { MedusaService } from './medusa.service';
import { HttpTypes } from '@medusajs/types';

describe('ProductTypesService', () => {
  let service: ProductTypesService;
  let medusaServiceMock: any;

  const mockTypes: HttpTypes.StoreProductType[] = [
    {
      id: '1',
      value: 'Sofas',
      metadata: { image: { url: '/img/sofa.png' } }
    } as any,
    {
      id: '2',
      value: 'Chairs',
      metadata: { image: { url: '/img/chair.png' } }
    } as any,
  ];

  beforeEach(() => {
    medusaServiceMock = {
      fetch: jasmine.createSpy('fetch').and.callFake((url: string, opts: any) => {
        if (url === '/store/custom/product-types') {
          return Promise.resolve({ product_types: mockTypes, count: mockTypes.length });
        }
        return Promise.resolve({});
      })
    };
    TestBed.configureTestingModule({
      providers: [
        ProductTypesService,
        { provide: MedusaService, useValue: medusaServiceMock },
      ]
    });
    service = TestBed.inject(ProductTypesService);
  });

  it('should load product types', async () => {
    const result = await service.loadProductTypes();
    expect(result.productTypes.length).toBe(2);
    expect(service.productTypes().length).toBe(2);
    expect(service.count()).toBe(2);
  });

  it('should load product type by handle', async () => {
    await service.loadProductTypes();
    const type = await service.loadProductTypeByHandle('Sofas');
    expect(type?.value).toBe('Sofas');
    expect(service.currentProductType()?.value).toBe('Sofas');
  });

  it('should get product type image url', () => {
    const url = service.getProductTypeImageUrl(mockTypes[0]);
    expect(url).toBe('/img/sofa.png');
  });

  it('should check if product type has image', () => {
    expect(service.hasProductTypeImage(mockTypes[0])).toBeTrue();
    expect(service.hasProductTypeImage({ id: '3', value: 'NoImg', metadata: {} } as any)).toBeFalse();
  });
}); 