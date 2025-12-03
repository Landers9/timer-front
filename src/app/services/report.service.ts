// src/app/services/report.service.ts
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
 * Types de périodes disponibles
 */
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

/**
 * Types de rapports disponibles
 */
export type ReportType = 'global' | 'team' | 'individual';

/**
 * Formats d'export disponibles
 */
export type ExportFormat = 'pdf' | 'xlsx' | 'csv';

/**
 * Direction du trend
 */
export type TrendType = 'up' | 'down' | 'stable';

/**
 * Couleur des KPIs
 */
export type KpiColor = 'primary' | 'success' | 'warning' | 'error';

/**
 * Interface pour un KPI
 */
export interface ReportKPI {
  title: string;
  value: string;
  change: number;
  trend: TrendType;
  color: KpiColor;
}

/**
 * Status de performance
 */
export type PerformanceStatus = 'excellent' | 'good' | 'warning' | 'poor';

/**
 * Interface pour la performance d'un employé
 */
export interface EmployeePerformance {
  id: string;
  name: string;
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number;
  lateCount: number;
  onTimeRate: number;
  status: PerformanceStatus;
}

/**
 * Interface pour la performance d'une équipe
 */
export interface TeamPerformance {
  id: string;
  name: string;
  memberCount: number;
  avgHours: number;
  attendanceRate: number;
  productivity: number;
}

/**
 * Interface pour le top performer
 */
export interface TopPerformer {
  name: string;
  totalHours: number;
  attendanceRate: number;
}

/**
 * Interface pour la meilleure équipe
 */
export interface BestTeam {
  name: string;
  attendanceRate: number;
  productivity: number;
}

/**
 * Interface pour les points d'attention
 */
export interface AttentionPoints {
  message: string;
  change: number;
  trend: TrendType;
}

/**
 * Interface pour le résumé du rapport
 */
export interface ReportSummary {
  topPerformer: TopPerformer;
  bestTeam: BestTeam;
  attentionPoints: AttentionPoints;
}

/**
 * Interface pour la réponse complète des rapports
 */
export interface ReportResponse {
  kpis: ReportKPI[];
  employeePerformances: EmployeePerformance[];
  teamPerformances: TeamPerformance[];
  summary: ReportSummary;
}

/**
 * Interface pour les paramètres de requête des rapports
 */
export interface ReportParams {
  period: ReportPeriod;
  report_type: ReportType;
  team_id?: string;
  employee_id?: string;
}

/**
 * Interface pour les paramètres d'export de rapport
 */
export interface ExportReportRequest {
  report_type: ReportType;
  format: ExportFormat;
  start_date: string;
  end_date: string;
  team_id?: string;
  employee_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * GET /reports/ - Récupérer les données du rapport avec filtres
   *
   * @param params - Paramètres de la requête
   * @returns Observable<ReportResponse>
   */
  getReports(params: ReportParams): Observable<ReportResponse> {
    let httpParams = new HttpParams()
      .set('period', params.period)
      .set('report_type', params.report_type);

    if (params.team_id) {
      httpParams = httpParams.set('team_id', params.team_id);
    }

    if (params.employee_id) {
      httpParams = httpParams.set('employee_id', params.employee_id);
    }

    return this.http
      .get<ReportResponse>(`${this.apiUrl}/`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /reports/generate/ - Générer et exporter un rapport
   *
   * @param request - Paramètres d'export
   * @returns Observable<Blob> - Le fichier téléchargeable
   */
  generateReport(request: ExportReportRequest): Observable<Blob> {
    return this.http
      .post(`${this.apiUrl}/generate/`, request, {
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Calculer les dates de début et fin en fonction de la période
   * L'utilisateur ne choisit pas les dates, elles sont calculées automatiquement
   *
   * @param period - La période sélectionnée
   * @returns { start_date: string, end_date: string }
   */
  calculateDateRange(period: ReportPeriod): {
    start_date: string;
    end_date: string;
  } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: Date;

    switch (period) {
      case 'week':
        // 7 derniers jours
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;

      case 'month':
        // Début du mois courant
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case 'quarter':
        // Début du trimestre courant
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;

      case 'year':
        // Début de l'année courante
        startDate = new Date(now.getFullYear(), 0, 1);
        break;

      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate,
    };
  }

  /**
   * Helper pour télécharger le blob généré
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Générer le nom du fichier d'export
   */
  generateFilename(
    reportType: ReportType,
    format: ExportFormat,
    period: ReportPeriod
  ): string {
    const dateStr = new Date().toISOString().split('T')[0];
    return `rapport_${reportType}_${period}_${dateStr}.${format}`;
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage =
      'Une erreur est survenue lors de la récupération du rapport';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.status === 400) {
        errorMessage = 'Paramètres de requête invalides';
      } else if (error.status === 401) {
        errorMessage = 'Non autorisé';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.status === 404) {
        errorMessage = 'Rapport non trouvé';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur';
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}
