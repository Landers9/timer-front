// src/app/pages/dashboard/dashboard.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Chart, ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { ChartService } from '../../services/chart.service';
import { Timesheet, DashboardStats } from '../../models/timesheet.model';

type Period = 'day' | 'week' | 'month' | 'quarter';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hoursChart') hoursChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pauseChart') pauseChartRef!: ElementRef<HTMLCanvasElement>;

  private hoursChart: Chart | null = null;
  private pauseChart: Chart | null = null;

  // Signals
  currentDate = signal(new Date());
  isTracking = signal(false);
  selectedPeriod = signal<Period>('week');
  selectedTeam = signal<number | null>(null);
  selectedUser = signal<number | null>(null);

  readonly periods: Period[] = ['day', 'week', 'month', 'quarter'];

  isManager = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'manager';
  });

  stats = signal<DashboardStats>({
    hoursWorked: 40.5,
    pausesTaken: 5,
    avgArrival: '08:45',
    avgDeparture: '17:30',
    attendanceRate: 95,
  });

  weeklyHistory = signal<Timesheet[]>([
    {
      id: 1,
      userId: 1,
      date: new Date('2025-01-06'),
      clockIn: '08:30',
      clockOut: '17:30',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      totalHours: 8,
      status: 'completed',
    },
    {
      id: 2,
      userId: 1,
      date: new Date('2025-01-07'),
      clockIn: '08:45',
      clockOut: '17:15',
      pauseStart: '12:30',
      pauseEnd: '13:00',
      totalHours: 7.5,
      status: 'completed',
    },
    {
      id: 3,
      userId: 1,
      date: new Date('2025-01-08'),
      clockIn: '08:30',
      clockOut: '17:30',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      totalHours: 8,
      status: 'completed',
    },
    {
      id: 4,
      userId: 1,
      date: new Date('2025-01-09'),
      clockIn: '08:00',
      clockOut: '18:00',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      totalHours: 9,
      status: 'completed',
    },
    {
      id: 5,
      userId: 1,
      date: new Date('2025-01-10'),
      clockIn: '09:00',
      clockOut: '17:00',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      totalHours: 7,
      status: 'completed',
    },
  ]);

  teams = signal([
    { id: 1, name: 'Development Team' },
    { id: 2, name: 'Design Team' },
    { id: 3, name: 'Marketing Team' },
  ]);

  users = signal([
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Wilson' },
  ]);

  constructor(
    public authService: AuthService,
    private chartService: ChartService
  ) {}

  ngOnInit() {
    this.updateTime();
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Créer les graphiques après que la vue soit initialisée
    this.initCharts();
  }

  ngOnDestroy() {
    // Détruire les graphiques pour éviter les fuites mémoire
    this.chartService.destroyChart(this.hoursChart);
    this.chartService.destroyChart(this.pauseChart);
  }

  private initCharts() {
    this.createHoursChart();
    this.createPauseChart();
  }

  private createHoursChart() {
    const canvas = this.hoursChartRef.nativeElement;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Hours Worked',
            data: [8, 7.5, 8, 9, 7, 0, 0],
            backgroundColor: 'rgba(255, 195, 0, 0.2)',
            borderColor: '#FFC300',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value + 'h';
              },
            },
          },
        },
      },
    };

    this.hoursChart = this.chartService.createChart(canvas, config);
  }

  private createPauseChart() {
    const canvas = this.pauseChartRef.nativeElement;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
          {
            label: 'Pause Duration (min)',
            data: [45, 60, 30, 45, 50],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: '#3B82F6',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value + ' min';
              },
            },
          },
        },
      },
    };

    this.pauseChart = this.chartService.createChart(canvas, config);
  }

  // Méthode pour mettre à jour les données des graphiques
  updateChartData() {
    if (this.hoursChart) {
      // Exemple de mise à jour des données
      this.hoursChart.data.datasets[0].data = [7, 8, 8.5, 9, 7.5, 0, 0];
      this.hoursChart.update();
    }

    if (this.pauseChart) {
      this.pauseChart.data.datasets[0].data = [50, 55, 35, 40, 45];
      this.pauseChart.update();
    }
  }

  updateTime() {
    setInterval(() => {
      this.currentDate.set(new Date());
    }, 1000);
  }

  loadDashboardData() {
    console.log('Loading dashboard data...');
    // Après le chargement, mettre à jour les graphiques
    // this.updateChartData();
  }

  toggleTimeTracker() {
    this.isTracking.update((value) => !value);
  }

  onPeriodChange(period: Period) {
    this.selectedPeriod.set(period);
    this.loadDashboardData();
  }

  onTeamChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTeam.set(value ? parseInt(value) : null);
    this.selectedUser.set(null);
    this.loadDashboardData();
  }

  onUserChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedUser.set(value ? parseInt(value) : null);
    this.loadDashboardData();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  formatTime(date: Date): string {
    return date
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toUpperCase();
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'in-progress':
        return 'text-warning';
      case 'absent':
        return 'text-error';
      default:
        return 'text-dark-600';
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'in-progress':
        return 'bg-warning/10 text-warning';
      case 'absent':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-dark-600';
    }
  }
}
