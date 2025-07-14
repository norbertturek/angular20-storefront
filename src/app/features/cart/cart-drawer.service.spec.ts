import { CartDrawerService } from './cart-drawer.service';

describe('CartDrawerService', () => {
  let service: CartDrawerService;

  beforeEach(() => {
    service = new CartDrawerService();
  });

  it('should be closed by default', () => {
    expect(service.isOpen()).toBe(false);
  });

  it('should open the drawer', () => {
    service.open();
    expect(service.isOpen()).toBe(true);
  });

  it('should close the drawer', () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('should toggle the drawer', () => {
    service.toggle();
    expect(service.isOpen()).toBe(true);
    service.toggle();
    expect(service.isOpen()).toBe(false);
  });
}); 