import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService, AUTH_STORAGE_KEY } from './auth.service';
import { authGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { Component } from '@angular/core';

@Component({ template: '' })
class DummyComponent {}

describe('AuthService & AuthGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([
          { path: '', component: DummyComponent, canActivate: [authGuard] },
          { path: 'login', component: LoginComponent },
        ]),
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create AuthService', () => {
    expect(authService).toBeTruthy();
  });

  it('should report unauthenticated when localStorage is empty', () => {
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getRole()).toBeNull();
  });

  it('should report authenticated when valid token is stored', () => {
    const validData = {
      role: 'team' as const,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 10, // 10 days in future
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validData));

    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should report unauthenticated and clear expired token', () => {
    const expiredData = {
      role: 'admin' as const,
      expiresAt: Date.now() - 1000, // 1 second in the past
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(expiredData));

    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('should clear storage and reset user on logout', () => {
    const validData = {
      role: 'admin' as const,
      expiresAt: Date.now() + 1000 * 60 * 60,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validData));

    authService.logout();

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(authService.currentUser()).toBeNull();
  });

  it('should allow access via authGuard when authenticated', () => {
    const validData = {
      role: 'team' as const,
      expiresAt: Date.now() + 1000 * 60 * 60,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validData));

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should redirect to /login via authGuard when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result.toString()).toContain('/login');
  });

  it('should return false from updatePasswords if no passwords provided', async () => {
    const result = await authService.updatePasswords('', '  ');
    expect(result).toBe(false);
  });
});
