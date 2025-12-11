import { TestBed } from '@angular/core/testing';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let routerMock: { navigate: jest.Mock };
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let isAuthenticatedValue: boolean;

  beforeEach(() => {
    isAuthenticatedValue = false;

    routerMock = {
      navigate: jest.fn(),
    };

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            // Signal mock: callable function that returns current value
            isAuthenticated: () => isAuthenticatedValue,
          },
        },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access when user is authenticated', () => {
    isAuthenticatedValue = true;

    const result = TestBed.runInInjectionContext(() =>
      AuthGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login when user is not authenticated', () => {
    isAuthenticatedValue = false;

    const result = TestBed.runInInjectionContext(() =>
      AuthGuard(mockRoute, mockState)
    );

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
  });

  it('should pass the correct returnUrl in query params', () => {
    isAuthenticatedValue = false;
    mockState = { url: '/teams' } as RouterStateSnapshot;

    TestBed.runInInjectionContext(() => AuthGuard(mockRoute, mockState));

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/teams' },
    });
  });

  it('should handle different protected routes', () => {
    isAuthenticatedValue = false;

    const protectedRoutes = [
      '/dashboard',
      '/users',
      '/teams',
      '/reports',
      '/profile',
    ];

    protectedRoutes.forEach((route) => {
      mockState = { url: route } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => AuthGuard(mockRoute, mockState));

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: route },
      });
    });
  });
});
