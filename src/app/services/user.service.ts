// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interface pour la réponse de l'API /users/me/
export interface ApiUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  device_id: string | null;
  fingerprint_id: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  created_by: string | null;
}

// Interface pour la mise à jour du profil utilisateur
export interface UpdateUserRequest {
  phone_number?: string;
  email: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
}

// Interface pour le changement de mot de passe
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les informations de l'utilisateur connecté
   * GET /api/v1/users/me/
   */
  getCurrentUser(): Observable<ApiUserResponse> {
    return this.http.get<ApiUserResponse>(`${this.apiUrl}/me/`).pipe(
      tap((response) => {
        console.log('User data fetched:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour les informations de l'utilisateur
   * PUT /api/v1/users/{id}/
   */
  updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Observable<ApiUserResponse> {
    return this.http
      .put<ApiUserResponse>(`${this.apiUrl}/${userId}/`, data)
      .pipe(
        tap((response) => {
          console.log('User updated:', response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Changer le mot de passe de l'utilisateur
   * PUT /api/v1/users/change-password/{id}/
   */
  changePassword(userId: string, data: ChangePasswordRequest): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/change-password/${userId}/`, data)
      .pipe(
        tap((response) => {
          console.log('Password changed successfully:', response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs HTTP
   */
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
      } else if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 401) {
        errorMessage = 'Non autorisé';
      } else if (error.status === 404) {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('User Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
