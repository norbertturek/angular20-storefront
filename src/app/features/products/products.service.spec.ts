import { ProductsService } from './products.service';
import { HttpTypes } from '@medusajs/types';
import { TestBed } from '@angular/core/testing';
import { MedusaService } from '@api/medusa.service';
import { RegionsService } from '@api/regions.service';

describe('ProductsService', () => {
    let service: ProductsService;
    let medusaServiceMock: any;
    let regionsServiceMock: any;

    // Helper: minimal valid StoreProduct
    function createProduct(overrides: Partial<HttpTypes.StoreProduct> = {}): HttpTypes.StoreProduct {
        return {
            id: 'p1',
            title: 'Product',
            subtitle: '',
            description: '',
            handle: '',
            status: 'published',
            images: overrides.images ?? [],
            thumbnail: overrides.thumbnail ?? '',
            variants: overrides.variants ?? [],
            options: overrides.options ?? [],
            collection: overrides.collection ?? null,
            categories: overrides.categories ?? [],
            type: overrides.type ?? null,
            tags: overrides.tags ?? [],
            created_at: '',
            updated_at: '',
            deleted_at: null,
            external_id: '',
            // Add all possibly nullable/optional fields as null or []
            weight: null,
            length: null,
            height: null,
            width: null,
            hs_code: null,
            origin_country: null,
            mid_code: null,
            material: null,
            metadata: null,
            is_giftcard: false,
            collection_id: overrides.collection_id ?? null,
            type_id: overrides.type_id ?? null,
            discountable: false,
            // ... any other fields that may be required by StoreProduct
            ...overrides,
        };
    }

    beforeEach(() => {
        medusaServiceMock = { fetch: jasmine.createSpy('fetch') };
        regionsServiceMock = {};
        TestBed.configureTestingModule({
            providers: [
                ProductsService,
                { provide: MedusaService, useValue: medusaServiceMock },
                { provide: RegionsService, useValue: regionsServiceMock },
            ],
        });
        service = TestBed.inject(ProductsService);
    });

    it('should initialize with empty products and not loading', () => {
        expect(service.products()).toEqual([]);
        expect(service.count()).toBe(0);
        expect(service.isLoading()).toBe(false);
        expect(service.error()).toBeNull();
    });

    it('should load products successfully', async () => {
        const product = createProduct({ id: '1' });
        const response = { products: [product], count: 1 };
        medusaServiceMock.fetch.and.returnValue(Promise.resolve(response));
        const result = await service.loadProducts();
        expect(service.products()).toEqual([product]);
        expect(service.count()).toBe(1);
        expect(result.products).toEqual([product]);
        expect(service.isLoading()).toBe(false);
        expect(service.error()).toBeNull();
    });

    it('should handle error in loadProducts', async () => {
        medusaServiceMock.fetch.and.throwError('fail');
        const result = await service.loadProducts();
        expect(service.products()).toEqual([]);
        expect(service.count()).toBe(0);
        expect(service.error()).toBe('Failed to load products');
        expect(result.products).toEqual([]);
        expect(service.isLoading()).toBe(false);
    });

    it('should load product by handle', async () => {
        const product = createProduct({ id: '2', handle: 'h' });
        medusaServiceMock.fetch.and.returnValue(Promise.resolve({ products: [product] }));
        const result = await service.loadProductByHandle('h');
        expect(result).toEqual(product);
        expect(service.currentProduct()).toEqual(product);
        expect(service.error()).toBeNull();
    });

    it('should handle error in loadProductByHandle', async () => {
        medusaServiceMock.fetch.and.throwError('fail');
        const result = await service.loadProductByHandle('h');
        expect(result).toBeNull();
        expect(service.currentProduct()).toBeNull();
        expect(service.error()).toBe('Failed to load product');
    });

    it('should load product by id', async () => {
        const product = createProduct({ id: '3' });
        medusaServiceMock.fetch.and.returnValue(Promise.resolve({ product }));
        const result = await service.loadProductById('3');
        expect(result).toEqual(product);
        expect(service.currentProduct()).toEqual(product);
        expect(service.error()).toBeNull();
    });

    it('should handle error in loadProductById', async () => {
        medusaServiceMock.fetch.and.throwError('fail');
        const result = await service.loadProductById('3');
        expect(result).toBeNull();
        expect(service.currentProduct()).toBeNull();
        expect(service.error()).toBe('Failed to load product');
    });

    it('should load products by ids', async () => {
        const products = [createProduct({ id: '4' }), createProduct({ id: '5' })];
        medusaServiceMock.fetch.and.returnValue(Promise.resolve({ products }));
        const result = await service.loadProductsByIds(['4', '5']);
        expect(result).toEqual(products);
        expect(service.products()).toEqual(products);
        expect(service.count()).toBe(2);
    });

    it('should handle error in loadProductsByIds', async () => {
        medusaServiceMock.fetch.and.throwError('fail');
        const result = await service.loadProductsByIds(['4', '5']);
        expect(result).toEqual([]);
        expect(service.products()).toEqual([]);
        expect(service.count()).toBe(0);
        expect(service.error()).toBe('Failed to load products');
    });

    it('should search products', async () => {
        const product = createProduct({ id: '6' });
        spyOn(service, 'loadProducts').and.returnValue(Promise.resolve({ products: [product], count: 1 }));
        const result = await service.searchProducts('query');
        expect(service.loadProducts).toHaveBeenCalledWith({ q: 'query' });
        expect(result.products[0].id).toBe('6');
    });

    it('should get product image url and thumbnail', () => {
        const product = createProduct({
            images: [
                { id: 'img1', url: 'img1', rank: 0 },
                { id: 'img2', url: 'img2', rank: 1 },
            ],
            thumbnail: 'thumb',
        });
        expect(service.getProductImageUrl(product, 1)).toBe('img2');
        expect(service.getProductImageUrl(product)).toBe('img1');
        expect(service.getProductThumbnail(product)).toBe('thumb');
        expect(service.hasProductImages(product)).toBe(true);
        expect(service.getProductImages(product)).toEqual([
            { id: 'img1', url: 'img1', rank: 0 },
            { id: 'img2', url: 'img2', rank: 1 },
        ]);
    });

    it('should handle product with no images', () => {
        const product = createProduct({ images: [], thumbnail: null });
        expect(service.getProductImageUrl(product)).toBeNull();
        expect(service.getProductThumbnail(product)).toBeNull();
        expect(service.hasProductImages(product)).toBe(false);
        expect(service.getProductImages(product)).toEqual([]);
    });
}); 