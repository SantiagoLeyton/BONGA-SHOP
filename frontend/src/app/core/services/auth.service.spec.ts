import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.removeItem('bonga.auth.v1');
    TestBed.configureTestingModule({});
  });

  it('registers and sets isAuthed', async () => {
    const s = TestBed.inject(AuthService);
    expect(s.isAuthed()).toBeFalse();
    await s.register('Test User', 'test@example.com', 'Password123!');
    expect(s.isAuthed()).toBeTrue();
    expect(s.user()?.email).toBe('test@example.com');
  });

  it('logout clears auth', async () => {
    const s = TestBed.inject(AuthService);
    await s.login('test@example.com', 'Password123!');
    s.logout();
    expect(s.isAuthed()).toBeFalse();
  });
});

