// src/app/services/team.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Interface pour une équipe telle que retournée par l'API (format snake_case)
 */
export interface ApiTeam {
  id: string;
  name: string;
  description: string;
  manager: string; // UUID du manager
}

/**
 * Interface pour la réponse de liste paginée des équipes
 */
export interface ApiTeamsListResponse {
  count: number;
  next: boolean;
  previous: boolean;
  results: ApiTeam[];
  code: number;
}

/**
 * Interface pour créer une équipe
 */
export interface CreateTeamRequest {
  name: string;
  description: string;
  manager: string; // UUID du manager qui crée
}

/**
 * Interface pour mettre à jour une équipe
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

/**
 * Interface pour ajouter un membre à une équipe
 */
export interface AddMemberRequest {
  user_id: string;
}

/**
 * Interface pour la réponse d'ajout de membre
 */
export interface AddMemberResponse {
  message: string;
  team: ApiTeam;
}

/**
 * Interface pour retirer un membre d'une équipe
 */
export interface RemoveMemberRequest {
  user_id: string;
}

/**
 * Interface pour la réponse de retrait de membre
 */
export interface RemoveMemberResponse {
  message: string;
  team: ApiTeam;
}

/**
 * Interface pour les membres d'une équipe
 */
export interface TeamMembersResponse {
  team: string;
  manager: any;
  members: string[];
  total_members: number;
}

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/teams`;

  constructor(private http: HttpClient) {}

  // ========== MÉTHODES CRUD ÉQUIPES ==========

  /**
   * GET /teams/ - Récupérer toutes les équipes
   * @returns Observable<ApiTeam[]>
   */
  getAllTeams(): Observable<ApiTeam[]> {
    return this.http.get<ApiTeamsListResponse>(`${this.apiUrl}/`).pipe(
      map((response) => response.results),
      catchError(this.handleError)
    );
  }

  /**
   * GET /teams/{id}/ - Récupérer une équipe par ID
   * @param teamId - ID de l'équipe
   * @returns Observable<ApiTeam>
   */
  getTeamById(teamId: string): Observable<ApiTeam> {
    return this.http
      .get<ApiTeam>(`${this.apiUrl}/${teamId}/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /teams/ - Créer une nouvelle équipe
   * @param teamData - Données de la nouvelle équipe
   * @returns Observable<ApiTeam>
   */
  createTeam(teamData: CreateTeamRequest): Observable<ApiTeam> {
    return this.http
      .post<ApiTeam>(`${this.apiUrl}/`, teamData)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /teams/{id}/ - Mettre à jour une équipe
   * @param teamId - ID de l'équipe
   * @param teamData - Données à mettre à jour
   * @returns Observable<ApiTeam>
   */
  updateTeam(teamId: string, teamData: UpdateTeamRequest): Observable<ApiTeam> {
    return this.http
      .put<ApiTeam>(`${this.apiUrl}/${teamId}/`, teamData)
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE /teams/{id}/ - Supprimer une équipe
   * @param teamId - ID de l'équipe
   * @returns Observable<void>
   */
  deleteTeam(teamId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${teamId}/`)
      .pipe(catchError(this.handleError));
  }

  // ========== GESTION DES MEMBRES ==========

  /**
   * GET /teams/{id}/employees/ - Récupérer les employés d'une équipe
   * @param teamId - ID de l'équipe
   * @returns Observable<any[]> - Liste des utilisateurs
   */
  getTeamEmployees(teamId: string): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/${teamId}/employees/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /teams/{id}/add-member/ - Ajouter un membre à une équipe
   * @param teamId - ID de l'équipe
   * @param memberData - Données du membre à ajouter
   * @returns Observable<AddMemberResponse>
   */
  addMemberToTeam(
    teamId: string,
    memberData: AddMemberRequest
  ): Observable<AddMemberResponse> {
    return this.http
      .post<AddMemberResponse>(
        `${this.apiUrl}/${teamId}/add-member/`,
        memberData
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /teams/{id}/members/ - Récupérer les membres d'une équipe
   * @param teamId - ID de l'équipe
   * @returns Observable<TeamMembersResponse>
   */
  getTeamMembers(teamId: string): Observable<TeamMembersResponse> {
    return this.http
      .get<TeamMembersResponse>(`${this.apiUrl}/${teamId}/members/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /teams/{id}/remove-member/ - Retirer un membre d'une équipe
   * @param teamId - ID de l'équipe
   * @param memberData - Données du membre à retirer
   * @returns Observable<RemoveMemberResponse>
   */
  removeMemberFromTeam(
    teamId: string,
    memberData: RemoveMemberRequest
  ): Observable<RemoveMemberResponse> {
    return this.http
      .post<RemoveMemberResponse>(
        `${this.apiUrl}/${teamId}/remove-member/`,
        memberData
      )
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
        errorMessage = 'Équipe non trouvée.';
      } else if (error.status === 400) {
        errorMessage = 'Données invalides.';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    console.error('Erreur TeamService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
