import { TestBed } from '@angular/core/testing';
import { CartService, AddToCartItem } from './cart.service';
import { MedusaService } from '@api/medusa.service';
import { RegionsService } from '@api/regions.service';
import { ErrorHandlerService } from './error-handler.service';
import { ToastService } from './toast.service';
import { signal } from '@angular/core';

describe('CartService', () => {
  let service: CartService;
  let medusaServiceMock: any;
  let regionsServiceMock: any;
  let errorHandlerMock: any;
  let toastServiceMock: any;
  let platformId: any;

  beforeEach(() => {
    medusaServiceMock = {
      store: {
        cart: {
          create: jasmine.createSpy('create'),
          retrieve: jasmine.createSpy('retrieve'),
          createLineItem: jasmine.createSpy('createLineItem'),
          updateLineItem: jasmine.createSpy('updateLineItem'),
          deleteLineItem: jasmine.createSpy('deleteLineItem'),
          update: jasmine.createSpy('update'),
          complete: jasmine.createSpy('complete'),
          addShippingMethod: jasmine.createSpy('addShippingMethod'),
        },
      },
      fetch: jasmine.createSpy('fetch'),
    };
    regionsServiceMock = { listRegions: jasmine.createSpy('listRegions') };
    errorHandlerMock = { handleError: jasmine.createSpy('handleError') };
    toastServiceMock = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') };
    platformId = 'browser';

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: MedusaService, useValue: medusaServiceMock },
        { provide: RegionsService, useValue: regionsServiceMock },
        { provide: ErrorHandlerService, useValue: errorHandlerMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: 'PLATFORM_ID', useValue: platformId },
      ]
    });
    service = TestBed.inject(CartService);
  });

  it('should create cart with default region', async () => {
    regionsServiceMock.listRegions.and.returnValue(Promise.resolve([{ id: 'region-1' }]));
    medusaServiceMock.store.cart.create.and.returnValue(Promise.resolve({ cart: { id: 'cart-1', items: [] } }));
    const cart = await service.createCart();
    expect(cart.id).toBe('cart-1');
    expect(medusaServiceMock.store.cart.create).toHaveBeenCalledWith({ region_id: 'region-1' });
  });

  it('should add item to cart', async () => {
    regionsServiceMock.listRegions.and.returnValue(Promise.resolve([{ id: 'region-2' }]));
    medusaServiceMock.store.cart.create.and.returnValue(Promise.resolve({ cart: { id: 'cart-2', items: [] } }));
    medusaServiceMock.store.cart.createLineItem.and.returnValue(Promise.resolve({}));
    medusaServiceMock.store.cart.retrieve.and.returnValue(Promise.resolve({ cart: { id: 'cart-2', items: [{ variant_id: 'v1', quantity: 2 }] } }));
    const item: AddToCartItem = { variant_id: 'v1', quantity: 2 };
    await service.addToCart(item);
    expect(medusaServiceMock.store.cart.createLineItem).toHaveBeenCalledWith('cart-2', { variant_id: 'v1', quantity: 2 });
  });

  it('should update line item', async () => {
    (service as any).cartId.set('cart-3');
    service.cart.set({ id: 'cart-3', items: [{ id: 'line-1', quantity: 1 }] } as any);
    medusaServiceMock.store.cart.updateLineItem.and.returnValue(Promise.resolve({}));
    medusaServiceMock.store.cart.retrieve.and.returnValue(Promise.resolve({ cart: { id: 'cart-3', items: [{ id: 'line-1', quantity: 3 }] } }));
    spyOn(service, 'retrieveCart').and.returnValue(Promise.resolve({ id: 'cart-3', items: [{ id: 'line-1', quantity: 3 }] } as any));
    await service.updateLineItem('line-1', 3);
    expect(medusaServiceMock.store.cart.updateLineItem).toHaveBeenCalledTimes(1);
    expect(medusaServiceMock.store.cart.updateLineItem).toHaveBeenCalledWith('cart-3', 'line-1', { quantity: 3 });
  });

  it('should remove line item', async () => {
    (service as any).cartId.set('cart-4');
    service.cart.set({ id: 'cart-4', items: [{ id: 'line-2', quantity: 1 }] } as any);
    medusaServiceMock.store.cart.deleteLineItem.and.returnValue(Promise.resolve({}));
    medusaServiceMock.store.cart.retrieve.and.returnValue(Promise.resolve({ cart: { id: 'cart-4', items: [] } }));
    spyOn(service, 'retrieveCart').and.returnValue(Promise.resolve({ id: 'cart-4', items: [] } as any));
    await service.removeLineItem('line-2');
    expect(medusaServiceMock.store.cart.deleteLineItem).toHaveBeenCalledTimes(1);
    expect(medusaServiceMock.store.cart.deleteLineItem).toHaveBeenCalledWith('cart-4', 'line-2');
  });

  it('should clear cart', () => {
    service.cart.set({ id: 'cart-5', items: [] } as any);
    (service as any).cartId.set('cart-5');
    service.clearCart();
    expect(service.cart()).toBeNull();
    expect((service as any).cartId()).toBeNull();
  });

  it('should handle errors in createCart', async () => {
    regionsServiceMock.listRegions.and.returnValue(Promise.resolve([]));
    let error: Error | null = null;
    try {
      await service.createCart();
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeDefined();
    expect(error!.message).toBe('No region available for cart creation');
    expect(errorHandlerMock.handleError).toHaveBeenCalled();
  });
}); 