// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

/**
 * Interface pour la mise à jour du profil utilisateur
 * Seuls ces champs peuvent être modifiés via PATCH /users/{id}/
 */
export interface UpdateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  position?: string;
  department?: string;
}

/**
 * Interface pour le changement de mot de passe
 * Utilisé avec POST /users/{id}/change-password/
 */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

/**
 * Interface pour la réponse du changement de mot de passe
 */
export interface ChangePasswordResponse {
  detail: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * GET /users/me/ - Récupérer l'utilisateur actuellement connecté
   * @returns Observable<User>
   */
  getCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/me/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /users/{id}/ - Mettre à jour le profil utilisateur
   * @param userId - ID de l'utilisateur
   * @param userData - Données à mettre à jour
   * @returns Observable<User>
   */
  updateUser(userId: string, userData: UpdateUserRequest): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/${userId}/`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /users/change-password/{id}/ - Changer le mot de passe
   * @param userId - ID de l'utilisateur
   * @param passwordData - Ancien et nouveau mot de passe
   * @returns Observable<ChangePasswordResponse>
   */
  changePassword(
    userId: string,
    passwordData: ChangePasswordRequest
  ): Observable<ChangePasswordResponse> {
    return this.http
      .put<ChangePasswordResponse>(
        `${this.apiUrl}/change-password/${userId}/`,
        passwordData
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Gestion des erreurs HTTP
   * @param error - Erreur HTTP
   * @returns Observable avec le message d'erreur
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        errorMessage = "Vous n'avez pas les droits nécessaires.";
      } else if (error.status === 404) {
        errorMessage = 'Ressource introuvable.';
      } else if (error.status === 400) {
        // Erreurs de validation de l'API
        if (error.error && typeof error.error === 'object') {
          const errors = error.error;
          const firstKey = Object.keys(errors)[0];
          if (firstKey && Array.isArray(errors[firstKey])) {
            errorMessage = errors[firstKey][0];
          } else if (errors.detail) {
            errorMessage = errors.detail;
          }
        }
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }

    return throwError(() => ({ message: errorMessage, error }));
  }
}
