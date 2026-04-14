import { TestBed } from '@angular/core/testing';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  beforeEach(() => {
    localStorage.removeItem('bonga.wishlist.v1');
    TestBed.configureTestingModule({});
  });

  it('toggles items and updates count', () => {
    const s = TestBed.inject(WishlistService);
    expect(s.count()).toBe(0);
    s.toggle('p1');
    expect(s.has('p1')).toBeTrue();
    expect(s.count()).toBe(1);
    s.toggle('p1');
    expect(s.has('p1')).toBeFalse();
    expect(s.count()).toBe(0);
  });
});

