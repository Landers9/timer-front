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
 * Périodes disponibles
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

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  /**
   * GET /stats/kpis - Récupérer les KPIs avec filtres
   * @param filterType - Type de filtre (teams ou employees)
   * @param period - Période (day, week, month, year)
   * @param entityId - ID de l'équipe ou de l'employé (optionnel)
   * @returns Observable<KPIResponse>
   */
  getKPIs(
    filterType: FilterType,
    period: PeriodType,
    entityId?: string
  ): Observable<KPIResponse> {
    let params = new HttpParams()
      .set('filter_type', filterType)
      .set('period', period);

    // Ajouter l'ID si fourni
    if (entityId) {
      const paramName = filterType === 'teams' ? 'team_id' : 'employee_id';
      params = params.set(paramName, entityId);
    }

    return this.http
      .get<KPIResponse>(`${this.apiUrl}/kpis`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir les labels de graphique selon la période
   * @param period - Période sélectionnée
   * @returns Labels appropriés
   */
  getChartLabels(period: PeriodType): string[] {
    const labelMap: Record<PeriodType, string[]> = {
      day: ['00h', '04h', '08h', '12h', '16h', '20h'],
      week: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      month: ['S1', 'S2', 'S3', 'S4'],
      year: [
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Jun',
        'Jul',
        'Aoû',
        'Sep',
        'Oct',
        'Nov',
        'Déc',
      ],
    };

    return labelMap[period];
  }

  /**
   * Gestion des erreurs HTTP
   * @param error - Erreur HTTP
   * @returns Observable avec le message d'erreur
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage =
      'Une erreur est survenue lors de la récupération des statistiques';

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
        errorMessage = 'Données statistiques non trouvées.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }

    console.error('Erreur Stats API:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
