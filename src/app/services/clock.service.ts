// src/app/services/clock.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Interface pour la localisation
 */
export interface ClockLocation {
  latitude: number;
  longitude: number;
}

/**
 * Interface pour une action de clock
 */
export type ClockAction = 'clock_in' | 'clock_out' | 'break_in' | 'break_out';

/**
 * Interface pour la requête d'action clock
 */
export interface ClockActionRequest {
  action: ClockAction;
  location: ClockLocation;
}

/**
 * Interface pour la réponse clock de l'API
 */
export interface ApiClockRecord {
  id: string;
  user: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  break_in_time: string | null;
  break_out_time: string | null;
  location: string;
}

/**
 * Interface pour la réponse de liste des clocks
 */
export interface ApiClocksListResponse {
  count: number;
  next: boolean;
  previous: boolean;
  results: ApiClockRecord[];
  code: number;
}

/**
 * Interface pour les erreurs spécifiques
 */
export interface ClockErrorResponse {
  detail: string;
  distance?: number;
  action_denied?: ClockAction;
}

@Injectable({
  providedIn: 'root',
})
export class ClockService {
  private apiUrl = `${environment.apiUrl}/clocks`;
  private usersApiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * POST /clocks/ - Effectuer une action de clock (clock_in, clock_out, break_in, break_out)
   * @param action - Type d'action
   * @param location - Localisation géographique
   * @returns Observable<ApiClockRecord>
   */
  clockAction(
    action: ClockAction,
    location: ClockLocation
  ): Observable<ApiClockRecord> {
    const request: ClockActionRequest = {
      action,
      location,
    };

    return this.http
      .post<ApiClockRecord>(`${this.apiUrl}/`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /users/{userId}/clocks/ - Récupérer l'historique des clocks d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Observable<ApiClockRecord[]>
   */
  getUserClocks(userId: string): Observable<ApiClockRecord[]> {
    return this.http
      .get<ApiClocksListResponse>(`${this.usersApiUrl}/${userId}/clocks/`)
      .pipe(
        map((response) => response.results),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir la localisation actuelle de l'utilisateur
   * @returns Promise<ClockLocation>
   */
  getCurrentLocation(): Promise<ClockLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("La géolocalisation n'est pas supportée par ce navigateur")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Impossible d'obtenir votre position";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Autorisation de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Position non disponible';
              break;
            case error.TIMEOUT:
              message = 'Délai de géolocalisation dépassé';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
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
      const errorResponse = error.error as ClockErrorResponse;

      if (errorResponse?.detail) {
        errorMessage = errorResponse.detail;

        // Ajouter des informations supplémentaires si disponibles
        if (errorResponse.distance !== undefined) {
          errorMessage += ` (Distance: ${errorResponse.distance.toFixed(0)}m)`;
        }
      } else if (error.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        errorMessage = "Vous n'avez pas les droits nécessaires.";
      } else if (error.status === 400) {
        errorMessage = 'Requête invalide.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }

    console.error('Erreur Clock API:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
