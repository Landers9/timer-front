// src/app/pages/reports/reports.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-angular';
import { TeamService, ApiTeam } from '../../services/team.service';
import { UserService, ApiUser } from '../../services/user.service';
import {
  ReportService,
  ReportResponse,
  ReportPeriod,
  ReportType,
  ExportFormat,
  ReportParams,
} from '../../services/report.service';

// Interfaces identiques à l'original
interface KPI {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface EmployeePerformance {
  id: string;
  name: string;
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number;
  lateCount: number;
  onTimeRate: number;
  status: 'excellent' | 'good' | 'warning' | 'poor';
}

interface TeamPerformance {
  id: string;
  name: string;
  memberCount: number;
  avgHours: number;
  attendanceRate: number;
  productivity: number;
}

interface Summary {
  topPerformer: {
    name: string;
    totalHours: number;
    attendanceRate: number;
  };
  bestTeam: {
    name: string;
    attendanceRate: number;
    productivity: number;
  };
  attentionPoints: {
    message: string;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

type Period = 'week' | 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  // Icons
  readonly ClockIcon = Clock;
  readonly UsersIcon = Users;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly CalendarIcon = Calendar;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;

  // Loading & Error states
  isLoading = signal(false);
  isExporting = signal(false);
  errorMessage = signal<string | null>(null);

  // Filters
  selectedPeriod = signal<Period>('month');
  selectedReportType = signal<ReportType>('global');
  selectedTeamId = signal<string | null>(null);
  selectedEmployeeId = signal<string | null>(null);
  selectedExportFormat = signal<ExportFormat>('pdf');

  // Data from API
  teams = signal<{ id: string; name: string }[]>([]);
  employees = signal<{ id: string; name: string }[]>([]);

  // KPIs
  kpis = signal<KPI[]>([]);

  // Performance data
  employeePerformances = signal<EmployeePerformance[]>([]);
  teamPerformances = signal<TeamPerformance[]>([]);

  // Summary
  summary = signal<Summary | null>(null);

  // Computed (identiques à l'original)
  showTeamSelect = computed(() => this.selectedReportType() === 'team');
  showEmployeeSelect = computed(
    () => this.selectedReportType() === 'individual'
  );

  constructor(
    private reportService: ReportService,
    private teamService: TeamService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadTeams();
    this.loadEmployees();
    this.loadReports();
  }

  /**
   * Charger les équipes depuis l'API
   */
  private loadTeams(): void {
    this.teamService.getAllTeams().subscribe({
      next: (apiTeams: ApiTeam[]) => {
        this.teams.set(apiTeams.map((t) => ({ id: t.id, name: t.name })));
      },
      error: (error) => console.error('Erreur chargement équipes:', error),
    });
  }

  /**
   * Charger les employés depuis l'API
   */
  private loadEmployees(): void {
    this.userService.getAllUsers().subscribe({
      next: (apiUsers: ApiUser[]) => {
        this.employees.set(
          apiUsers.map((u) => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
          }))
        );
      },
      error: (error) => console.error('Erreur chargement employés:', error),
    });
  }

  /**
   * Charger les rapports depuis l'API
   */
  loadReports(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: ReportParams = {
      period: this.selectedPeriod() as ReportPeriod,
      report_type: this.selectedReportType(),
    };

    if (this.selectedTeamId() && this.selectedReportType() === 'team') {
      params.team_id = this.selectedTeamId()!;
    }

    if (
      this.selectedEmployeeId() &&
      this.selectedReportType() === 'individual'
    ) {
      params.employee_id = this.selectedEmployeeId()!;
    }

    this.reportService.getReports(params).subscribe({
      next: (response: ReportResponse) => {
        // Mapper les KPIs avec les icônes
        this.kpis.set(
          response.kpis.map((kpi) => ({
            ...kpi,
            icon: this.getKpiIcon(kpi.title),
          }))
        );

        this.employeePerformances.set(response.employeePerformances);
        this.teamPerformances.set(response.teamPerformances);
        this.summary.set(response.summary);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur chargement rapports:', error);
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Obtenir l'icône correspondant au titre du KPI
   */
  private getKpiIcon(title: string): any {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('heure')) return this.ClockIcon;
    if (lowerTitle.includes('présence')) return this.CheckCircleIcon;
    if (lowerTitle.includes('retard')) return this.AlertCircleIcon;
    if (lowerTitle.includes('absence')) return this.XCircleIcon;
    return this.ClockIcon;
  }

  /**
   * Handler changement type de rapport (identique à l'original + reload)
   */
  onReportTypeChange(): void {
    this.selectedTeamId.set(null);
    this.selectedEmployeeId.set(null);
    this.loadReports();
  }

  /**
   * Exporter le rapport
   */
  exportReport(): void {
    this.isExporting.set(true);
    this.errorMessage.set(null);

    const dateRange = this.reportService.calculateDateRange(
      this.selectedPeriod() as ReportPeriod
    );

    {
        "report_type": "attendance|work_hours|breaks|full",
        "format": "csv|pdf|excel",
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "filter_type": "teams|employees|all",
        "entity_id": "uuid" (optional)
    }
    
    const request = {
      report_type: this.selectedReportType(),
      format: this.selectedExportFormat(),
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      ...(this.selectedTeamId() && { team_id: this.selectedTeamId()! }),
      ...(this.selectedEmployeeId() && {
        employee_id: this.selectedEmployeeId()!,
      }),
    };

    this.reportService.generateReport(request).subscribe({
      next: (blob: Blob) => {
        const filename = this.reportService.generateFilename(
          this.selectedReportType(),
          this.selectedExportFormat(),
          this.selectedPeriod() as ReportPeriod
        );
        this.reportService.downloadFile(blob, filename);
        this.isExporting.set(false);
      },
      error: (error) => {
        console.error('Erreur export rapport:', error);
        this.errorMessage.set(error.message || "Erreur lors de l'export");
        this.isExporting.set(false);
      },
    });
  }

  // ========== HELPERS (identiques à l'original) ==========

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'excellent':
        return 'badge-success';
      case 'good':
        return 'badge-info';
      case 'warning':
        return 'badge-warning';
      case 'poor':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Bon';
      case 'warning':
        return 'Attention';
      case 'poor':
        return 'Insuffisant';
      default:
        return 'N/A';
    }
  }

  getKpiColorClass(color: string): string {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
