// src/app/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  user: User;
  requires2FA?: boolean;
  sessionId?: string;
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

interface Verify2FARequest {
  otpCode: string;
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  sessionId = signal<string | null>(null);
  requires2FA = signal(false);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // ========== Login Flow ==========
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response.requires2FA) {
            // 2FA required - stay on 2FA page
            this.requires2FA.set(true);
            this.sessionId.set(response.sessionId || null);
          } else {
            // Login successful
            this.setAuthState(response.token, response.user);
          }
        })
      );
  }

  // ========== 2FA Flow ==========
  verify2FA(otpCode: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/verify-2fa`, {
        otpCode,
        sessionId: this.sessionId(),
      })
      .pipe(
        tap((response) => {
          this.requires2FA.set(false);
          this.sessionId.set(null);
          this.setAuthState(response.token, response.user);
        })
      );
  }

  resend2FA(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/resend-2fa`,
      { sessionId: this.sessionId() }
    );
  }

  // ========== Password Management ==========
  requestPasswordReset(email: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(
    token: string,
    newPassword: string
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/reset-password`,
      { token, newPassword }
    );
  }

  validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.get<{ valid: boolean }>(
      `${this.apiUrl}/auth/validate-reset-token/${token}`
    );
  }

  // ========== Logout & Session ==========
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.requires2FA.set(false);
    this.sessionId.set(null);
  }

  expireSession(): void {
    this.logout();
  }

  // ========== Token Management ==========
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setAuthState(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userStr && token) {
      this.currentUser.set(JSON.parse(userStr));
      this.isAuthenticated.set(true);
    }
  }
}
