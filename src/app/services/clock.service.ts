// src/app/services/clock.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
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

/**
 * Enum pour les états possibles du clock
 */
export enum ClockState {
  NO_SESSION = 'NO_SESSION', // Pas de session active → Clock In
  WORKING = 'WORKING', // Travail en cours, pas de pause → Clock Out + Break In
  ON_BREAK = 'ON_BREAK', // En pause → Break Out uniquement
  BACK_FROM_BREAK = 'BACK_FROM_BREAK', // Retour de pause → Clock Out SEULEMENT
  DAY_COMPLETED = 'DAY_COMPLETED', // Journée terminée → Clock In (nouvelle session)
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
   * GET /users/clocks/current/ - Récupérer l'état actuel du clock de l'utilisateur
   * @returns Observable<ApiClockRecord | null>
   */
  getCurrentClock(): Observable<ApiClockRecord | null> {
    return this.http
      .get<ApiClockRecord>(`${this.usersApiUrl}/clocks/current/`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Si 404, pas de session active
          if (error.status === 404) {
            return of(null);
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Déterminer l'état actuel du clock basé sur les champs
   * @param record - Enregistrement clock ou null
   * @returns ClockState
   */
  determineClockState(record: ApiClockRecord | null): ClockState {
    // Pas de session ou pas d'enregistrement
    if (!record || !record.clock_in_time) {
      return ClockState.NO_SESSION;
    }

    // Journée terminée (clock_out fait)
    if (record.clock_out_time) {
      return ClockState.DAY_COMPLETED;
    }

    // Clock in fait, clock out pas fait
    // Vérifier l'état de la pause
    if (record.break_in_time && !record.break_out_time) {
      // Pause en cours
      return ClockState.ON_BREAK;
    }

    if (record.break_in_time && record.break_out_time) {
      // Pause terminée, retour au travail
      return ClockState.BACK_FROM_BREAK;
    }

    // Pas de pause, travail en cours
    return ClockState.WORKING;
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
   * Obtenir la position GPS actuelle
   * @returns Promise<ClockLocation>
   */
  getCurrentLocation(): Promise<ClockLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n'est pas supportée"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: 6.366, //position.coords.latitude,
            longitude: 2.429  // position.coords.longitude,
          });
        },
        (error) => {
          let message = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permission de géolocalisation refusée';
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
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.status === 400) {
        errorMessage = 'Requête invalide';
      } else if (error.status === 401) {
        errorMessage = 'Non autorisé';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur';
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}
