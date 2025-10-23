// src/app/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(true);
  sessionId = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // ========== LOGIN FLOW ==========
  login(email: string, password: string): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(`${this.apiUrl}/auth/login`, {
      email,
      password,
    });
  }

  // ========== 2FA VERIFICATION (After Login) ==========
  verify2FA(otpCode: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/verify-2fa`, {
        otpCode,
        sessionId: this.sessionId(),
      })
      .pipe(
        tap((response) => {
          this.setAuthState(response.token, response.user);
          this.sessionId.set(null);
        })
      );
  }

  resend2FA(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/resend-2fa`,
      { sessionId: this.sessionId() }
    );
  }

  // ========== FORGOT PASSWORD FLOW ==========
  requestPasswordReset(email: string): Observable<{ resetSessionId: string }> {
    return this.http.post<{ resetSessionId: string }>(
      `${this.apiUrl}/auth/forgot-password`,
      { email }
    );
  }

  verifyResetCode(
    resetCode: string,
    resetSessionId: string
  ): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(
      `${this.apiUrl}/auth/verify-reset-code`,
      { resetCode, resetSessionId }
    );
  }

  resetPassword(
    newPassword: string,
    resetSessionId: string
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/reset-password`,
      { newPassword, resetSessionId }
    );
  }

  // ========== LOGOUT & SESSION ==========
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.sessionId.set(null);
  }

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
