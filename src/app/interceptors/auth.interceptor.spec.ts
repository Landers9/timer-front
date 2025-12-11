import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    getToken: jest.Mock;
    refreshAccessToken: jest.Mock;
    logout: jest.Mock;
  };
  let routerMock: { navigate: jest.Mock };

  beforeEach(() => {
    authServiceMock = {
      getToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn().mockReturnValue(of(undefined)),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token injection', () => {
    it('should add Authorization header when token exists', () => {
      authServiceMock.getToken.mockReturnValue('my-jwt-token');

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer my-jwt-token'
      );
      req.flush({});
    });

    it('should not add Authorization header when token is null', () => {
      authServiceMock.getToken.mockReturnValue(null);

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Auth endpoints exclusion', () => {
    const authEndpoints = [
      '/auth/login/',
      '/auth/login/verify-code/',
      '/auth/login/resend-code/',
      '/auth/logout/',
      '/auth/token/refresh/',
      '/users/reset-password/',
      '/users/reset-password/verify-code/',
      '/users/confirm-password-reset/',
    ];

    authEndpoints.forEach((endpoint) => {
      it(`should NOT add Authorization header for ${endpoint}`, () => {
        authServiceMock.getToken.mockReturnValue('my-jwt-token');

        httpClient.post(endpoint, {}).subscribe();

        const req = httpMock.expectOne(endpoint);
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
      });
    });
  });

  describe('401 Error handling', () => {
    it('should attempt token refresh on 401 error', () => {
      authServiceMock.getToken.mockReturnValue('expired-token');
      authServiceMock.refreshAccessToken.mockReturnValue(
        of({ access: 'new-token', access_expires: Date.now() + 3600000 })
      );

      httpClient.get('/api/protected').subscribe();

      const req = httpMock.expectOne('/api/protected');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      // After refresh, a new request should be made
      const retryReq = httpMock.expectOne('/api/protected');
      expect(retryReq.request.headers.get('Authorization')).toBe(
        'Bearer new-token'
      );
      retryReq.flush({ data: 'success' });
    });

    it('should logout and redirect when refresh token fails', () => {
      authServiceMock.getToken.mockReturnValue('expired-token');
      authServiceMock.refreshAccessToken.mockReturnValue(
        throwError(() => new Error('Refresh failed'))
      );

      httpClient.get('/api/protected').subscribe({
        error: () => {
          expect(authServiceMock.logout).toHaveBeenCalled();
          expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
        },
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('Non-401 errors', () => {
    it('should pass through 400 errors without refresh attempt', () => {
      authServiceMock.getToken.mockReturnValue('valid-token');

      httpClient.get('/api/data').subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne('/api/data');
      req.flush(
        { message: 'Bad Request' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should pass through 500 errors without refresh attempt', () => {
      authServiceMock.getToken.mockReturnValue('valid-token');

      httpClient.get('/api/data').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne('/api/data');
      req.flush(
        { message: 'Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should pass through 404 errors without refresh attempt', () => {
      authServiceMock.getToken.mockReturnValue('valid-token');

      httpClient.get('/api/notfound').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          expect(authServiceMock.refreshAccessToken).not.toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne('/api/notfound');
      req.flush(
        { message: 'Not Found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });
});
