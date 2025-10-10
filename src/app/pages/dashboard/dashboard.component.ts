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
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-angular';
import { Chart, ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { ChartService } from '../../services/chart.service';

type FilterType = 'teams' | 'employees';
type PeriodType = 'day' | 'week' | 'month' | 'year';
type DataViewType = 'work' | 'break';

interface Team {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

type DisplayEntity = Team | Employee;

interface DashboardStats {
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number;
  avgArrivalTime: string;
  trend: 'up' | 'down' | 'stable';
}

interface BreakStats {
  totalBreakHours: number;
  avgBreakPerDay: number;
  breakComplianceRate: number;
  avgBreakTime: string;
  trend: 'up' | 'down' | 'stable';
}

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
  isManager = computed(() => this.currentUser()?.role === 'manager');
  userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  // Filters
  filterType = signal<FilterType>('teams');
  selectedEntityId = signal<number | null>(null);
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Period for charts
  hoursPeriod = signal<PeriodType>('week');
  attendancePeriod = signal<PeriodType>('week');

  // Data view toggle (work or break)
  dataView = signal<DataViewType>('work');

  // Data
  teams = signal<Team[]>([
    { id: 1, name: 'Équipe Développement' },
    { id: 2, name: 'Équipe Marketing' },
    { id: 3, name: 'Équipe Ventes' },
    { id: 4, name: 'Équipe Support' },
  ]);

  employees = signal<Employee[]>([
    { id: 1, firstName: 'Jean', lastName: 'Dupont' },
    { id: 2, firstName: 'Marie', lastName: 'Martin' },
    { id: 3, firstName: 'Pierre', lastName: 'Bernard' },
    { id: 4, firstName: 'Sophie', lastName: 'Dubois' },
    { id: 5, firstName: 'Luc', lastName: 'Moreau' },
  ]);

  // Stats
  stats = signal<DashboardStats>({
    totalHours: 156.5,
    avgHoursPerDay: 7.8,
    attendanceRate: 95.5,
    avgArrivalTime: '08:42',
    trend: 'up',
  });

  breakStats = signal<BreakStats>({
    totalBreakHours: 25.5,
    avgBreakPerDay: 1.2,
    breakComplianceRate: 98,
    avgBreakTime: '12:30',
    trend: 'stable',
  });

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
    return this.filterType() === 'teams'
      ? (this.teams() as DisplayEntity[])
      : (this.employees() as DisplayEntity[]);
  });

  constructor(
    private authService: AuthService,
    private chartService: ChartService
  ) {
    // Initialize dates (last 30 days by default)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate.set(today.toISOString().split('T')[0]);
    this.startDate.set(thirtyDaysAgo.toISOString().split('T')[0]);

    // Effect to reload data when filters change
    effect(() => {
      const filterType = this.filterType();
      const entityId = this.selectedEntityId();
      const start = this.startDate();
      const end = this.endDate();

      console.log('Filters changed:', { filterType, entityId, start, end });
      this.loadData();
    });

    // Effect to update charts when period or view changes
    effect(() => {
      const hoursPeriod = this.hoursPeriod();
      const attendancePeriod = this.attendancePeriod();
      const dataView = this.dataView();

      if (this.hoursChart) {
        this.updateHoursChart();
      }
      if (this.attendanceChart) {
        this.updateAttendanceChart();
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.chartService.destroyChart(this.hoursChart);
    this.chartService.destroyChart(this.attendanceChart);
  }

  // Helper to get display name for an entity
  getEntityDisplayName(entity: DisplayEntity): string {
    if ('name' in entity) {
      return entity.name; // Team
    } else {
      return `${entity.firstName} ${entity.lastName}`; // Employee
    }
  }

  // Clock in/out
  toggleClock(): void {
    this.isTracking.update((val) => !val);
    this.lastClockTime.set(new Date());

    if (this.isTracking()) {
      console.log('Clock IN at', this.lastClockTime());
    } else {
      console.log('Clock OUT at', this.lastClockTime());
    }
  }

  // Filter change handlers
  onFilterTypeChange(): void {
    this.selectedEntityId.set(null);
  }

  onEntityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedEntityId.set(value ? Number(value) : null);
  }

  // Load data from API (mock for now)
  loadData(): void {
    // Simulate API call
    console.log('Loading data with filters...');
    // Update stats based on filters
    // This would be an actual API call in production
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
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Heures travaillées',
            data: [8, 7.5, 8, 9, 7, 0, 0],
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
            max: 10,
            ticks: {
              stepSize: 2,
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
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Taux de présence',
            data: [100, 95, 100, 90, 100, 0, 0],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
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
            callbacks: {
              label: (context) => `${context.parsed.y}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
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

    const period = this.hoursPeriod();
    const isWorkView = this.dataView() === 'work';

    let labels: string[] = [];
    let data: number[] = [];
    let label = '';
    let color = '';

    if (isWorkView) {
      label = 'Heures travaillées';
      color = '#FFC300';

      switch (period) {
        case 'day':
          labels = ['00h', '04h', '08h', '12h', '16h', '20h'];
          data = [0, 0, 2, 3, 2, 1];
          break;
        case 'week':
          labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          data = [8, 7.5, 8, 9, 7, 0, 0];
          break;
        case 'month':
          labels = ['S1', 'S2', 'S3', 'S4'];
          data = [38, 40, 35, 39];
          break;
        case 'year':
          labels = [
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
          ];
          data = [160, 152, 168, 156, 160, 144, 120, 168, 160, 156, 0, 0];
          break;
      }
    } else {
      label = 'Heures de pause';
      color = '#3B82F6';

      switch (period) {
        case 'day':
          labels = ['00h', '04h', '08h', '12h', '16h', '20h'];
          data = [0, 0, 0, 1, 0.5, 0];
          break;
        case 'week':
          labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          data = [1, 1.5, 1, 1.2, 1, 0, 0];
          break;
        case 'month':
          labels = ['S1', 'S2', 'S3', 'S4'];
          data = [5, 5.5, 4.8, 6];
          break;
        case 'year':
          labels = [
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
          ];
          data = [20, 19, 22, 21, 20, 18, 15, 22, 20, 19, 0, 0];
          break;
      }
    }

    this.hoursChart.data.labels = labels;
    this.hoursChart.data.datasets[0].label = label;
    this.hoursChart.data.datasets[0].data = data;
    this.hoursChart.data.datasets[0].backgroundColor = color;
    this.hoursChart.data.datasets[0].borderColor = isWorkView
      ? '#CC9C00'
      : '#2563EB';
    this.hoursChart.update();
  }

  updateAttendanceChart(): void {
    if (!this.attendanceChart) return;

    const period = this.attendancePeriod();
    const isWorkView = this.dataView() === 'work';

    let labels: string[] = [];
    let data: number[] = [];
    let label = '';
    let color = '';

    if (isWorkView) {
      label = 'Taux de présence';
      color = '#10B981';

      switch (period) {
        case 'day':
          labels = ['00h', '04h', '08h', '12h', '16h', '20h'];
          data = [0, 0, 100, 100, 100, 0];
          break;
        case 'week':
          labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          data = [100, 95, 100, 90, 100, 0, 0];
          break;
        case 'month':
          labels = ['S1', 'S2', 'S3', 'S4'];
          data = [96, 98, 92, 95];
          break;
        case 'year':
          labels = [
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
          ];
          data = [95, 93, 97, 94, 96, 92, 88, 96, 95, 94, 0, 0];
          break;
      }
    } else {
      label = 'Taux de conformité pauses';
      color = '#F59E0B';

      switch (period) {
        case 'day':
          labels = ['00h', '04h', '08h', '12h', '16h', '20h'];
          data = [0, 0, 0, 100, 100, 0];
          break;
        case 'week':
          labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          data = [100, 100, 95, 100, 100, 0, 0];
          break;
        case 'month':
          labels = ['S1', 'S2', 'S3', 'S4'];
          data = [98, 97, 99, 96];
          break;
        case 'year':
          labels = [
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
          ];
          data = [98, 97, 99, 96, 98, 95, 94, 99, 98, 97, 0, 0];
          break;
      }
    }

    this.attendanceChart.data.labels = labels;
    this.attendanceChart.data.datasets[0].label = label;
    this.attendanceChart.data.datasets[0].data = data;
    this.attendanceChart.data.datasets[0].borderColor = color;
    this.attendanceChart.data.datasets[0].backgroundColor = `${color}1A`;
    this.attendanceChart.update();
  }
}
