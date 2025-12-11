import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jest.Mocked<Router>;
  const authApiUrl = `${environment.apiUrl}/auth`;
  const userApiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    routerSpy = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;

    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST /auth/login/ and store verification token', () => {
      const mockResponse = {
        requires_verification: true,
        message: 'Code envoyé',
        token: 'verification-token-123',
      };

      service.login('test@test.com', 'password123').subscribe((response) => {
        expect(response.requires_verification).toBe(true);
        expect(response.token).toBe('verification-token-123');
      });

      const req = httpMock.expectOne(`${authApiUrl}/login/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@test.com',
        password: 'password123',
      });
      req.flush(mockResponse);

      expect(service.verificationToken()).toBe('verification-token-123');
      expect(localStorage.getItem('verification_token')).toBe(
        'verification-token-123'
      );
    });
  });

  describe('verifyLoginCode', () => {
    it('should POST /auth/login/verify-code/ and set auth state', () => {
      // Setup verification token first
      service.verificationToken.set('verification-token-123');

      const mockResponse = {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'EMPLOYEE',
        },
        access: 'access-token-xyz',
        refresh: 'refresh-token-xyz',
        access_expires: Math.floor(Date.now() / 1000) + 3600,
        refresh_expires: Math.floor(Date.now() / 1000) + 86400,
        message: 'Connexion réussie',
      };

      service.verifyLoginCode('123456').subscribe((response) => {
        expect(response.user.email).toBe('test@test.com');
        expect(response.access).toBe('access-token-xyz');
      });

      const req = httpMock.expectOne(`${authApiUrl}/login/verify-code/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        token: 'verification-token-123',
        code: '123456',
      });
      req.flush(mockResponse);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('test@test.com');
      expect(localStorage.getItem('access_token')).toBe('access-token-xyz');
    });

    it('should throw error when no verification token', (done) => {
      service.verificationToken.set(null);

      service.verifyLoginCode('123456').subscribe({
        error: (error) => {
          expect(error.message).toBe('No verification token found');
          done();
        },
      });
    });
  });

  describe('resendLoginCode', () => {
    it('should POST /auth/login/resend-code/', () => {
      service.verificationToken.set('old-token');

      const mockResponse = {
        requires_verification: true,
        message: 'Code renvoyé',
        token: 'new-verification-token',
      };

      service.resendLoginCode().subscribe((response) => {
        expect(response.message).toBe('Code renvoyé');
      });

      const req = httpMock.expectOne(`${authApiUrl}/login/resend-code/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'old-token' });
      req.flush(mockResponse);

      expect(service.verificationToken()).toBe('new-verification-token');
    });
  });

  describe('logout', () => {
    it('should POST /auth/logout/ and clear auth state', () => {
      // Setup authenticated state
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('current_user', JSON.stringify({ id: 'user-1' }));
      service.isAuthenticated.set(true);

      service.logout().subscribe();

      const req = httpMock.expectOne(`${authApiUrl}/logout/`);
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear auth state even if API fails', () => {
      localStorage.setItem('access_token', 'token');
      service.isAuthenticated.set(true);

      service.logout().subscribe({
        error: () => {
          expect(service.isAuthenticated()).toBe(false);
          expect(localStorage.getItem('access_token')).toBeNull();
        },
      });

      const req = httpMock.expectOne(`${authApiUrl}/logout/`);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('refreshAccessToken', () => {
    it('should POST /auth/token/refresh/', () => {
      localStorage.setItem('refresh_token', 'refresh-token-xyz');

      const mockResponse = {
        access: 'new-access-token',
        access_expires: Math.floor(Date.now() / 1000) + 3600,
      };

      service.refreshAccessToken().subscribe((response) => {
        expect(response.access).toBe('new-access-token');
      });

      const req = httpMock.expectOne(`${authApiUrl}/token/refresh/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh: 'refresh-token-xyz' });
      req.flush(mockResponse);

      expect(localStorage.getItem('access_token')).toBe('new-access-token');
    });
  });

  describe('requestPasswordReset', () => {
    it('should POST /users/reset-password/', () => {
      const mockResponse = {
        detail: 'Code envoyé',
        token: 'reset-token-123',
      };

      service.requestPasswordReset('test@test.com').subscribe((response) => {
        expect(response.detail).toBe('Code envoyé');
        expect(response.token).toBe('reset-token-123');
      });

      const req = httpMock.expectOne(`${userApiUrl}/reset-password/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com' });
      req.flush(mockResponse);

      expect(service.resetToken()).toBe('reset-token-123');
    });
  });

  describe('verifyResetCode', () => {
    it('should POST /users/reset-password/verify-code/', () => {
      service.resetToken.set('reset-token-123');

      const mockResponse = {
        detail: 'Code vérifié',
        token: 'new-reset-token',
      };

      service.verifyResetCode('654321').subscribe((response) => {
        expect(response.detail).toBe('Code vérifié');
      });

      const req = httpMock.expectOne(
        `${userApiUrl}/reset-password/verify-code/`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        token: 'reset-token-123',
        code: '654321',
      });
      req.flush(mockResponse);

      expect(service.resetToken()).toBe('new-reset-token');
    });
  });

  describe('confirmPasswordReset', () => {
    it('should POST /users/confirm-password-reset/', () => {
      service.resetToken.set('reset-token-123');
      localStorage.setItem('reset_token', 'reset-token-123');

      service.confirmPasswordReset('newPassword123').subscribe();

      const req = httpMock.expectOne(`${userApiUrl}/confirm-password-reset/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        token: 'reset-token-123',
        new_password: 'newPassword123',
      });
      req.flush(null);

      expect(service.resetToken()).toBeNull();
      expect(localStorage.getItem('reset_token')).toBeNull();
    });
  });

  describe('token management', () => {
    it('getToken should return access token from localStorage', () => {
      localStorage.setItem('access_token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });

    it('getRefreshToken should return refresh token from localStorage', () => {
      localStorage.setItem('refresh_token', 'my-refresh-token');
      expect(service.getRefreshToken()).toBe('my-refresh-token');
    });

    it('isTokenExpired should return true when no token', () => {
      expect(service.isTokenExpired()).toBe(true);
    });

    it('isTokenExpired should return false when token is valid', () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem('access_expires', futureExpiry.toString());
      expect(service.isTokenExpired()).toBe(false);
    });

    it('isTokenExpired should return true when token is expired', () => {
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
      localStorage.setItem('access_expires', pastExpiry.toString());
      expect(service.isTokenExpired()).toBe(true);
    });
  });
});
