// src/app/services/auth.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, timer } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

// ========== INTERFACES API ==========
interface LoginResponse {
  requires_verification: boolean;
  message: string;
  token: string; // Token de vérification (temporaire)
}

interface VerifyCodeResponse {
  user: User;
  refresh: string;
  refresh_expires: number;
  access: string;
  access_expires: number;
  message: string;
}

interface ResendCodeResponse {
  requires_verification: boolean;
  message: string;
  token: string;
}

interface PasswordResetResponse {
  detail: string;
  token: string;
}

interface VerifyResetCodeResponse {
  detail: string;
  token: string;
}

// ========== TOKEN STORAGE KEYS ==========
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ACCESS_EXPIRES: 'access_expires',
  REFRESH_EXPIRES: 'refresh_expires',
  CURRENT_USER: 'current_user',
  VERIFICATION_TOKEN: 'verification_token',
  RESET_TOKEN: 'reset_token',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userApiUrl = `${environment.apiUrl}/users`;

  // ========== STATE MANAGEMENT ==========
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  verificationToken = signal<string | null>(null);
  resetToken = signal<string | null>(null);

  // Auto-refresh token management
  private refreshTokenTimer$ = new BehaviorSubject<number | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
    this.setupAutoRefresh();
  }

  // ========== 1. LOGIN FLOW ==========

  /**
   * Étape 1: Login avec email/password
   * Retourne un token de vérification temporaire
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, { email, password })
      .pipe(
        tap((response) => {
          // Stocker le token de vérification temporaire
          this.verificationToken.set(response.token);
          localStorage.setItem(STORAGE_KEYS.VERIFICATION_TOKEN, response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Étape 2: Vérifier le code 2FA
   * Retourne les tokens JWT et les infos user
   */
  verifyLoginCode(code: string): Observable<VerifyCodeResponse> {
    const token = this.verificationToken();
    if (!token) {
      return throwError(() => new Error('No verification token found'));
    }

    return this.http
      .post<VerifyCodeResponse>(`${this.apiUrl}/login/verify-code/`, {
        token,
        code,
      })
      .pipe(
        tap((response) => {
          this.setAuthState(
            response.access,
            response.refresh,
            response.access_expires,
            response.refresh_expires,
            response.user
          );
          // Nettoyer le token de vérification
          this.verificationToken.set(null);
          localStorage.removeItem(STORAGE_KEYS.VERIFICATION_TOKEN);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Renvoyer le code de vérification
   */
  resendLoginCode(): Observable<ResendCodeResponse> {
    const token = this.verificationToken();
    if (!token) {
      return throwError(() => new Error('No verification token found'));
    }

    return this.http
      .post<ResendCodeResponse>(`${this.apiUrl}/login/resend-code/`, { token })
      .pipe(
        tap((response) => {
          // Mettre à jour le token si changé
          if (response.token) {
            this.verificationToken.set(response.token);
            localStorage.setItem(
              STORAGE_KEYS.VERIFICATION_TOKEN,
              response.token
            );
          }
        }),
        catchError(this.handleError)
      );
  }

  // ========== 2. PASSWORD RESET FLOW ==========

  /**
   * Étape 1: Demander un reset de mot de passe
   */
  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    return this.http
      .post<PasswordResetResponse>(`${this.userApiUrl}/reset-password/`, {
        email,
      })
      .pipe(
        tap((response) => {
          this.resetToken.set(response.token);
          localStorage.setItem(STORAGE_KEYS.RESET_TOKEN, response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Étape 2: Vérifier le code de reset
   */
  verifyResetCode(code: string): Observable<VerifyResetCodeResponse> {
    const token = this.resetToken();
    if (!token) {
      return throwError(() => new Error('No reset token found'));
    }

    return this.http
      .post<VerifyResetCodeResponse>(
        `${this.userApiUrl}/reset-password/verify-code/`,
        { token, code }
      )
      .pipe(
        tap((response) => {
          // Mettre à jour avec le nouveau token pour la confirmation
          this.resetToken.set(response.token);
          localStorage.setItem(STORAGE_KEYS.RESET_TOKEN, response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Étape 3: Confirmer le nouveau mot de passe
   */
  confirmPasswordReset(newPassword: string): Observable<void> {
    const token = this.resetToken();
    if (!token) {
      return throwError(() => new Error('No reset token found'));
    }

    return this.http
      .post<void>(`${this.userApiUrl}/confirm-password-reset/`, {
        token,
        new_password: newPassword,
      })
      .pipe(
        tap(() => {
          // Nettoyer le token de reset
          this.resetToken.set(null);
          localStorage.removeItem(STORAGE_KEYS.RESET_TOKEN);
        }),
        catchError(this.handleError)
      );
  }

  // ========== 3. LOGOUT ==========

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout/`, {}).pipe(
      tap(() => {
        this.clearAuthState();
      }),
      catchError((error) => {
        // Même si l'API échoue, on déconnecte localement
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  // ========== 4. TOKEN REFRESH ==========

  /**
   * Rafraîchir l'access token avec le refresh token
   */
  refreshAccessToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuthState();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<{ access: string; access_expires: number }>(
        `${this.apiUrl}/token/refresh/`,
        { refresh: refreshToken }
      )
      .pipe(
        tap((response) => {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access);
          localStorage.setItem(
            STORAGE_KEYS.ACCESS_EXPIRES,
            response.access_expires.toString()
          );
          this.scheduleTokenRefresh(response.access_expires);
        }),
        catchError((error) => {
          this.clearAuthState();
          return throwError(() => error);
        })
      );
  }

  // ========== 5. TOKEN MANAGEMENT ==========

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(STORAGE_KEYS.ACCESS_EXPIRES);
    if (!expiresAt) return true;
    return Date.now() / 1000 > parseInt(expiresAt, 10);
  }

  // ========== 6. PRIVATE HELPERS ==========

  private setAuthState(
    accessToken: string,
    refreshToken: string,
    accessExpires: number,
    refreshExpires: number,
    user: User
  ): void {
    // Stocker les tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_EXPIRES, accessExpires.toString());
    localStorage.setItem(
      STORAGE_KEYS.REFRESH_EXPIRES,
      refreshExpires.toString()
    );
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    // Mettre à jour les signals
    this.currentUser.set(user);
    this.isAuthenticated.set(true);

    // Planifier le refresh automatique
    this.scheduleTokenRefresh(accessExpires);
  }

  private clearAuthState(): void {
    // Nettoyer le localStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Reset les signals
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.verificationToken.set(null);
    this.resetToken.set(null);

    // Arrêter le timer de refresh
    this.refreshTokenTimer$.next(null);

    // Rediriger vers login
    this.router.navigate(['/login']);
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const accessExpires = localStorage.getItem(STORAGE_KEYS.ACCESS_EXPIRES);

    if (userJson && accessToken && accessExpires) {
      const user = JSON.parse(userJson) as User;
      this.currentUser.set(user);
      this.isAuthenticated.set(true);

      // Vérifier si le token est expiré
      if (this.isTokenExpired()) {
        this.refreshAccessToken().subscribe({
          error: () => this.clearAuthState(),
        });
      } else {
        this.scheduleTokenRefresh(parseInt(accessExpires, 10));
      }
    }

    // Restaurer les tokens temporaires si présents
    const verificationToken = localStorage.getItem(
      STORAGE_KEYS.VERIFICATION_TOKEN
    );
    const resetToken = localStorage.getItem(STORAGE_KEYS.RESET_TOKEN);

    if (verificationToken) {
      this.verificationToken.set(verificationToken);
    }

    if (resetToken) {
      this.resetToken.set(resetToken);
    }
  }

  private setupAutoRefresh(): void {
    // S'abonner au timer de refresh
    this.refreshTokenTimer$
      .pipe(
        switchMap((expiresAt) => {
          if (!expiresAt) return [];

          const now = Date.now() / 1000;
          const timeUntilRefresh = Math.max(
            0,
            (expiresAt - environment.tokenRefreshBuffer - now) * 1000
          );

          return timer(timeUntilRefresh);
        })
      )
      .subscribe(() => {
        if (this.isAuthenticated()) {
          this.refreshAccessToken().subscribe();
        }
      });
  }

  private scheduleTokenRefresh(expiresAt: number): void {
    this.refreshTokenTimer$.next(expiresAt);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur serveur
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.status === 400) {
        errorMessage = 'Code de vérification invalide';
      } else if (error.status === 404) {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Auth Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
