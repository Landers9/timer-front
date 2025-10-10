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

interface KPI {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

interface EmployeePerformance {
  id: number;
  name: string;
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number;
  lateCount: number;
  onTimeRate: number;
  status: 'excellent' | 'good' | 'warning' | 'poor';
}

interface TeamPerformance {
  id: number;
  name: string;
  memberCount: number;
  avgHours: number;
  attendanceRate: number;
  productivity: number;
}

type Period = 'week' | 'month' | 'quarter' | 'year';
type ReportType = 'individual' | 'team' | 'global';

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

  // Filters
  selectedPeriod = signal<Period>('month');
  selectedReportType = signal<ReportType>('global');
  selectedTeamId = signal<number | null>(null);
  selectedEmployeeId = signal<number | null>(null);

  // Data
  teams = signal([
    { id: 1, name: 'Équipe Développement' },
    { id: 2, name: 'Équipe Marketing' },
    { id: 3, name: 'Équipe Ventes' },
    { id: 4, name: 'Équipe Support' },
  ]);

  employees = signal([
    { id: 1, name: 'Jean Dupont' },
    { id: 2, name: 'Marie Martin' },
    { id: 3, name: 'Pierre Bernard' },
    { id: 4, name: 'Sophie Dubois' },
    { id: 5, name: 'Luc Moreau' },
  ]);

  // KPIs
  kpis = computed<KPI[]>(() => [
    {
      title: 'Heures totales',
      value: '1,248h',
      change: 12.5,
      trend: 'up',
      icon: this.ClockIcon,
      color: 'primary',
    },
    {
      title: 'Taux de présence',
      value: '94.2%',
      change: -2.3,
      trend: 'down',
      icon: this.CheckCircleIcon,
      color: 'success',
    },
    {
      title: 'Retards',
      value: '23',
      change: 8.1,
      trend: 'up',
      icon: this.AlertCircleIcon,
      color: 'warning',
    },
    {
      title: 'Absences',
      value: '12',
      change: -15.2,
      trend: 'down',
      icon: this.XCircleIcon,
      color: 'error',
    },
  ]);

  employeePerformances = signal<EmployeePerformance[]>([
    {
      id: 1,
      name: 'Jean Dupont',
      totalHours: 168,
      avgHoursPerDay: 8.4,
      attendanceRate: 100,
      lateCount: 0,
      onTimeRate: 100,
      status: 'excellent',
    },
    {
      id: 2,
      name: 'Marie Martin',
      totalHours: 162,
      avgHoursPerDay: 8.1,
      attendanceRate: 95,
      lateCount: 2,
      onTimeRate: 90,
      status: 'good',
    },
    {
      id: 3,
      name: 'Pierre Bernard',
      totalHours: 156,
      avgHoursPerDay: 7.8,
      attendanceRate: 90,
      lateCount: 5,
      onTimeRate: 75,
      status: 'warning',
    },
    {
      id: 4,
      name: 'Sophie Dubois',
      totalHours: 170,
      avgHoursPerDay: 8.5,
      attendanceRate: 100,
      lateCount: 1,
      onTimeRate: 95,
      status: 'excellent',
    },
    {
      id: 5,
      name: 'Luc Moreau',
      totalHours: 145,
      avgHoursPerDay: 7.2,
      attendanceRate: 85,
      lateCount: 8,
      onTimeRate: 60,
      status: 'poor',
    },
  ]);

  teamPerformances = signal<TeamPerformance[]>([
    {
      id: 1,
      name: 'Équipe Développement',
      memberCount: 8,
      avgHours: 165,
      attendanceRate: 94,
      productivity: 88,
    },
    {
      id: 2,
      name: 'Équipe Marketing',
      memberCount: 5,
      avgHours: 158,
      attendanceRate: 91,
      productivity: 85,
    },
    {
      id: 3,
      name: 'Équipe Ventes',
      memberCount: 10,
      avgHours: 172,
      attendanceRate: 96,
      productivity: 92,
    },
    {
      id: 4,
      name: 'Équipe Support',
      memberCount: 6,
      avgHours: 160,
      attendanceRate: 89,
      productivity: 82,
    },
  ]);

  // Computed
  showTeamSelect = computed(() => this.selectedReportType() === 'team');
  showEmployeeSelect = computed(
    () => this.selectedReportType() === 'individual'
  );

  ngOnInit(): void {
    // Load data from API
  }

  // Helpers
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

  exportReport(): void {
    console.log('Exporting report...');
    // TODO: Implement export functionality
    alert('Export de rapport - Fonctionnalité à implémenter');
  }

  onReportTypeChange(): void {
    this.selectedTeamId.set(null);
    this.selectedEmployeeId.set(null);
  }
}
