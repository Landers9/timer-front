// src/app/services/stats.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Types de filtres disponibles
 */
export type FilterType = 'teams' | 'employees';

/**
 * Périodes disponibles pour l'agrégation des graphiques
 */
export type PeriodType = 'day' | 'week' | 'month' | 'year';

/**
 * Trend direction
 */
export type TrendType = 'up' | 'down' | 'stable';

/**
 * Interface pour les statistiques de travail
 */
export interface WorkStats {
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number;
  avgArrivalTime: string;
  trend: TrendType;
}

/**
 * Interface pour les statistiques de pause
 */
export interface BreakStats {
  totalBreakHours: number;
  avgBreakPerDay: number;
  breakComplianceRate: number;
  avgBreakTime: string;
  trend: TrendType;
}

/**
 * Interface pour les données de graphique
 */
export interface ChartData {
  labels: string[];
  data: number[];
}

/**
 * Interface pour la réponse complète des KPIs
 */
export interface KPIResponse {
  work: WorkStats;
  break_stats: BreakStats;
  hours_chart: ChartData;
  attendance_chart: ChartData;
}

/**
 * Interface pour les paramètres de requête KPIs
 */
export interface KPIParams {
  filter_type: FilterType;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  period: PeriodType;
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  /**
   * GET /stats/kpis - Récupérer les KPIs avec filtres
   *
   * @param params - Paramètres de la requête
   * @returns Observable<KPIResponse>
   *
   * Paramètres API:
   * - filter_type: 'teams' ou 'employees' (requis)
   * - entity_id: UUID de l'équipe ou de l'employé (optionnel)
   * - start_date: Date de début au format YYYY-MM-DD (par défaut: 30 jours avant end_date)
   * - end_date: Date de fin au format YYYY-MM-DD (par défaut: aujourd'hui)
   * - period: Période d'agrégation des graphiques ('day', 'week', 'month', 'year')
   */
  getKPIs(params: KPIParams): Observable<KPIResponse> {
    let httpParams = new HttpParams()
      .set('filter_type', params.filter_type)
      .set('period', params.period);

    // Ajouter entity_id si fourni
    if (params.entity_id) {
      httpParams = httpParams.set('entity_id', params.entity_id);
    }

    // Ajouter start_date si fourni
    if (params.start_date) {
      httpParams = httpParams.set('start_date', params.start_date);
    }

    // Ajouter end_date si fourni
    if (params.end_date) {
      httpParams = httpParams.set('end_date', params.end_date);
    }

    return this.http
      .get<KPIResponse>(`${this.apiUrl}/kpis`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir la date d'aujourd'hui au format YYYY-MM-DD
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Obtenir la date il y a N jours au format YYYY-MM-DD
   */
  getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Obtenir les dates par défaut (30 derniers jours)
   */
  getDefaultDateRange(): { start_date: string; end_date: string } {
    return {
      start_date: this.getDateDaysAgo(30),
      end_date: this.getTodayDate(),
    };
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage =
      'Une erreur est survenue lors de la récupération des statistiques';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.status === 400) {
        errorMessage = 'Paramètres de requête invalides';
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
