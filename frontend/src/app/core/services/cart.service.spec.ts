import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  beforeEach(() => {
    localStorage.removeItem('bonga.cart.v1');
    TestBed.configureTestingModule({});
  });

  it('adds items and counts qty', () => {
    const s = TestBed.inject(CartService);
    s.add('p1', 'v1', 1);
    s.add('p1', 'v1', 2);
    expect(s.count()).toBe(3);
  });

  it('merges variants when changed', () => {
    const s = TestBed.inject(CartService);
    s.add('p1', 'v1', 1);
    s.add('p1', 'v2', 2);
    s.changeVariant('p1', 'v1', 'v2');
    const items = s.items();
    expect(items.length).toBe(1);
    expect(items[0].variantId).toBe('v2');
    expect(items[0].qty).toBe(3);
  });
});

