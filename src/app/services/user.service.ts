// src/app/services/user.service.ts - VERSION MISE À JOUR
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

/**
 * Interface pour un utilisateur tel que retourné par l'API (format snake_case)
 */
export interface ApiUser {
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

/**
 * Interface pour la réponse de liste paginée
 */
export interface ApiUsersListResponse {
  count: number;
  next: boolean;
  previous: boolean;
  results: ApiUser[];
  code: number;
}

/**
 * Interface pour créer un utilisateur
 */
export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  device_id?: string | null;
  fingerprint_id?: string | null;
  position?: string;
  department?: string;
  hire_date?: string;
}

/**
 * Interface pour la mise à jour du profil utilisateur (via PUT)
 */
export interface UpdateUserProfileRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  position?: string;
  department?: string;
}

/**
 * Interface pour la mise à jour complète d'un utilisateur (via PUT pour admin)
 */
export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  is_active?: boolean;
  device_id?: string;
  fingerprint_id?: string;
  password?: string;
  position?: string;
  department?: string;
  hire_date?: string;
}

/**
 * Interface pour le changement de mot de passe
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

  // ========== MÉTHODES PROFIL UTILISATEUR ==========

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
   * PUT /users/{id}/ - Mettre à jour le profil utilisateur (pour profil personnel)
   * @param userId - ID de l'utilisateur
   * @param userData - Données à mettre à jour
   * @returns Observable<User>
   */
  updateUserProfile(
    userId: string,
    userData: UpdateUserProfileRequest
  ): Observable<User> {
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

  // ========== MÉTHODES CRUD UTILISATEURS (ADMIN/MANAGER) ==========

  /**
   * GET /users/ - Récupérer tous les utilisateurs
   * @returns Observable<ApiUser[]>
   */
  getAllUsers(): Observable<ApiUser[]> {
    return this.http.get<ApiUsersListResponse>(`${this.apiUrl}/`).pipe(
      map((response) => response.results),
      catchError(this.handleError)
    );
  }

  /**
   * GET /users/{id}/ - Récupérer un utilisateur par ID
   * @param userId - ID de l'utilisateur
   * @returns Observable<ApiUser>
   */
  getUserById(userId: string): Observable<ApiUser> {
    return this.http
      .get<ApiUser>(`${this.apiUrl}/${userId}/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /users/ - Créer un nouvel utilisateur
   * @param userData - Données du nouvel utilisateur
   * @returns Observable<ApiUser>
   */
  createUser(userData: CreateUserRequest): Observable<ApiUser> {
    return this.http
      .post<ApiUser>(`${this.apiUrl}/`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /users/{id}/ - Mettre à jour un utilisateur (admin/manager)
   * @param userId - ID de l'utilisateur
   * @param userData - Données à mettre à jour
   * @returns Observable<ApiUser>
   */
  updateUser(userId: string, userData: UpdateUserRequest): Observable<ApiUser> {
    return this.http
      .put<ApiUser>(`${this.apiUrl}/${userId}/`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE /users/{id}/ - Supprimer un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Observable<void>
   */
  deleteUser(userId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${userId}/`)
      .pipe(catchError(this.handleError));
  }

  // ========== GESTION DES ERREURS ==========

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
        errorMessage = 'Utilisateur non trouvé.';
      } else if (error.status === 400) {
        errorMessage = 'Données invalides.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }

    console.error('Erreur API:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
