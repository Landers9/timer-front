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
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-angular';
import { Chart, ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { ChartService } from '../../services/chart.service';
import { TeamService, ApiTeam } from '../../services/team.service';
import { UserService, ApiUser } from '../../services/user.service';
import {
  StatsService,
  KPIResponse,
  KPIParams,
  FilterType,
  PeriodType,
  WorkStats,
  BreakStats,
  ChartData,
} from '../../services/stats.service';

type DataViewType = 'work' | 'break';

interface Team {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

type DisplayEntity = Team | Employee;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hoursChart') hoursChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('attendanceChart')
  attendanceChartRef!: ElementRef<HTMLCanvasElement>;

  private hoursChart: Chart | null = null;
  private attendanceChart: Chart | null = null;

  // Icons
  readonly ClockIcon = Clock;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly CalendarIcon = Calendar;

  // Date
  currentDate = signal(new Date());
  formattedDate = computed(() => {
    const date = this.currentDate();
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  });

  // Clock in/out state
  isTracking = signal(false);
  lastClockTime = signal<Date | null>(null);

  // User info
  currentUser = computed(() => this.authService.currentUser());
  isManager = computed(
    () =>
      this.currentUser()?.role === 'MANAGER' ||
      this.currentUser()?.role === 'ADMIN'
  );

  userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.first_name} ${user.last_name}` : '';
  });

  // Filters
  filterType = signal<FilterType>('teams');
  selectedEntityId = signal<string | null>(null);
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Period for charts
  hoursPeriod = signal<PeriodType>('week');
  attendancePeriod = signal<PeriodType>('week');

  // Data view toggle (work or break)
  dataView = signal<DataViewType>('work');

  // Loading state
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Data from API
  teams = signal<Team[]>([]);
  employees = signal<Employee[]>([]);

  // Stats from API
  stats = signal<WorkStats>({
    totalHours: 0,
    avgHoursPerDay: 0,
    attendanceRate: 0,
    avgArrivalTime: '00:00',
    trend: 'stable',
  });

  breakStats = signal<BreakStats>({
    totalBreakHours: 0,
    avgBreakPerDay: 0,
    breakComplianceRate: 0,
    avgBreakTime: '00:00',
    trend: 'stable',
  });

  // Chart data from API
  hoursChartData = signal<ChartData>({ labels: [], data: [] });
  attendanceChartData = signal<ChartData>({ labels: [], data: [] });

  // Computed stats based on view
  currentStats = computed(() => {
    if (this.dataView() === 'work') {
      return {
        label1: 'Heures totales',
        value1: `${this.stats().totalHours}h`,
        label2: 'Moyenne par jour',
        value2: `${this.stats().avgHoursPerDay}h`,
        label3: 'Taux de présence',
        value3: `${this.stats().attendanceRate}%`,
        label4: 'Arrivée moyenne',
        value4: this.stats().avgArrivalTime,
        trend: this.stats().trend,
      };
    } else {
      return {
        label1: 'Pauses totales',
        value1: `${this.breakStats().totalBreakHours}h`,
        label2: 'Moyenne par jour',
        value2: `${this.breakStats().avgBreakPerDay}h`,
        label3: 'Taux de conformité',
        value3: `${this.breakStats().breakComplianceRate}%`,
        label4: 'Heure moyenne',
        value4: this.breakStats().avgBreakTime,
        trend: this.breakStats().trend,
      };
    }
  });

  // Computed entities list based on filter type
  entitiesList = computed<DisplayEntity[]>(() => {
    return this.filterType() === 'teams' ? this.teams() : this.employees();
  });

  constructor(
    private authService: AuthService,
    private chartService: ChartService,
    private statsService: StatsService,
    private teamService: TeamService,
    private userService: UserService
  ) {
    // Pas d'effect ici pour éviter les boucles infinies
    // Les rechargements sont déclenchés par les handlers explicitement
  }

  ngOnInit(): void {
    // Initialiser les dates par défaut (30 derniers jours)
    const defaultDates = this.statsService.getDefaultDateRange();
    this.startDate.set(defaultDates.start_date);
    this.endDate.set(defaultDates.end_date);

    // Charger les équipes et employés
    this.loadTeams();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
    // Charger les KPIs après l'initialisation des graphiques
    this.loadKPIs();
  }

  ngOnDestroy(): void {
    this.chartService.destroyChart(this.hoursChart);
    this.chartService.destroyChart(this.attendanceChart);
  }

  /**
   * Charger les équipes depuis l'API
   */
  private loadTeams(): void {
    this.teamService.getAllTeams().subscribe({
      next: (apiTeams: ApiTeam[]) => {
        const teams: Team[] = apiTeams.map((t) => ({
          id: t.id,
          name: t.name,
        }));
        this.teams.set(teams);
      },
      error: (error) => {
        console.error('Erreur chargement équipes:', error);
      },
    });
  }

  /**
   * Charger les employés depuis l'API
   */
  private loadEmployees(): void {
    this.userService.getAllUsers().subscribe({
      next: (apiUsers: ApiUser[]) => {
        const employees: Employee[] = apiUsers.map((u) => ({
          id: u.id,
          firstName: u.first_name,
          lastName: u.last_name,
        }));
        this.employees.set(employees);
      },
      error: (error) => {
        console.error('Erreur chargement employés:', error);
      },
    });
  }

  /**
   * Charger les KPIs depuis l'API
   */
  loadKPIs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: KPIParams = {
      filter_type: this.filterType(),
      period: this.hoursPeriod(),
    };

    // Ajouter entity_id si sélectionné
    const entityId = this.selectedEntityId();
    if (entityId) {
      params.entity_id = entityId;
    }

    // Ajouter les dates
    const startDate = this.startDate();
    const endDate = this.endDate();
    if (startDate) {
      params.start_date = startDate;
    }
    if (endDate) {
      params.end_date = endDate;
    }

    this.statsService.getKPIs(params).subscribe({
      next: (response: KPIResponse) => {
        // Mettre à jour les statistiques
        this.stats.set(response.work);
        this.breakStats.set(response.break_stats);

        // Mettre à jour les données des graphiques
        this.hoursChartData.set(response.hours_chart);
        this.attendanceChartData.set(response.attendance_chart);

        // Mettre à jour les graphiques
        this.updateHoursChart();
        this.updateAttendanceChart();

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur chargement KPIs:', error);
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      },
    });
  }

  // Handle filter type change
  onFilterTypeChange(value: string): void {
    this.filterType.set(value as FilterType);
    this.selectedEntityId.set(null); // Reset entity selection
    this.loadKPIs();
  }

  // Handle entity selection change
  onEntityChange(value: string): void {
    this.selectedEntityId.set(value || null);
    this.loadKPIs();
  }

  // Handle period change for hours chart
  onHoursPeriodChange(value: string): void {
    this.hoursPeriod.set(value as PeriodType);
    this.loadKPIs();
  }

  // Handle period change for attendance chart
  onAttendancePeriodChange(value: string): void {
    this.attendancePeriod.set(value as PeriodType);
    // Recharger les données avec la nouvelle période
    this.loadKPIs();
  }

  // Helper to get display name for an entity
  getEntityDisplayName(entity: DisplayEntity): string {
    if ('name' in entity) {
      return entity.name; // Team
    } else {
      return `${entity.firstName} ${entity.lastName}`; // Employee
    }
  }

  // Handle start date change
  onStartDateChange(value: string): void {
    this.startDate.set(value);
    this.loadKPIs();
  }

  // Handle end date change
  onEndDateChange(value: string): void {
    this.endDate.set(value);
    this.loadKPIs();
  }

  // Toggle data view (work/break)
  toggleDataView(): void {
    this.dataView.set(this.dataView() === 'work' ? 'break' : 'work');
    this.updateHoursChart();
    this.updateAttendanceChart();
  }

  // Initialize charts
  initializeCharts(): void {
    this.initHoursChart();
    this.initAttendanceChart();
  }

  initHoursChart(): void {
    if (!this.hoursChartRef) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Heures travaillées',
            data: [],
            backgroundColor: '#FFC300',
            borderColor: '#CC9C00',
            borderWidth: 1,
            borderRadius: 4,
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
          tooltip: {
            backgroundColor: '#1A1A1A',
            padding: 12,
            titleColor: '#FFF',
            bodyColor: '#FFF',
            cornerRadius: 4,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}h`,
            },
            grid: {
              color: '#E3E3E3',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    };

    this.hoursChart = this.chartService.createChart(
      this.hoursChartRef.nativeElement,
      config
    );
  }

  initAttendanceChart(): void {
    if (!this.attendanceChartRef) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Taux de présence',
            data: [],
            borderColor: '#10B981',
            backgroundColor: '#10B9811A',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
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
          tooltip: {
            backgroundColor: '#1A1A1A',
            padding: 12,
            titleColor: '#FFF',
            bodyColor: '#FFF',
            cornerRadius: 4,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`,
            },
            grid: {
              color: '#E3E3E3',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    };

    this.attendanceChart = this.chartService.createChart(
      this.attendanceChartRef.nativeElement,
      config
    );
  }

  updateHoursChart(): void {
    if (!this.hoursChart) return;

    const isWorkView = this.dataView() === 'work';
    const chartData = this.hoursChartData();

    // Mettre à jour les données
    this.hoursChart.data.labels = chartData.labels;
    this.hoursChart.data.datasets[0].data = chartData.data;

    // Mettre à jour le style selon la vue
    this.hoursChart.data.datasets[0].label = isWorkView
      ? 'Heures travaillées'
      : 'Heures de pause';
    this.hoursChart.data.datasets[0].backgroundColor = isWorkView
      ? '#FFC300'
      : '#3B82F6';
    this.hoursChart.data.datasets[0].borderColor = isWorkView
      ? '#CC9C00'
      : '#2563EB';

    this.hoursChart.update();
  }

  updateAttendanceChart(): void {
    if (!this.attendanceChart) return;

    const isWorkView = this.dataView() === 'work';
    const chartData = this.attendanceChartData();

    // Mettre à jour les données
    this.attendanceChart.data.labels = chartData.labels;
    this.attendanceChart.data.datasets[0].data = chartData.data;

    // Mettre à jour le style selon la vue
    this.attendanceChart.data.datasets[0].label = isWorkView
      ? 'Taux de présence'
      : 'Taux de conformité pauses';
    this.attendanceChart.data.datasets[0].borderColor = isWorkView
      ? '#10B981'
      : '#F59E0B';
    this.attendanceChart.data.datasets[0].backgroundColor = isWorkView
      ? '#10B9811A'
      : '#F59E0B1A';

    this.attendanceChart.update();
  }

  exportReport(): void {
    console.log('Exporting report...');
    // TODO: Implement export functionality
    alert('Export de rapport - Fonctionnalité à implémenter');
  }
}
