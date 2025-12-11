import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { StatsService } from './stats.service';
import { environment } from '../../environments/environment';

describe('StatsService', () => {
  let service: StatsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/stats`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getKPIs', () => {
    const mockKPIResponse = {
      work: {
        totalHours: 160,
        avgHoursPerDay: 8,
        attendanceRate: 95,
        avgArrivalTime: '08:45',
        trend: 'up' as const,
      },
      break_stats: {
        totalBreakHours: 20,
        avgBreakPerDay: 1,
        breakComplianceRate: 90,
        avgBreakTime: '12:30',
        trend: 'stable' as const,
      },
      hours_chart: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        data: [8, 8.5, 7.5, 8, 8],
      },
      attendance_chart: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        data: [100, 95, 90, 100, 95],
      },
    };

    it('should GET /stats/kpis with required params', () => {
      const params = { filter_type: 'teams' as const, period: 'week' as const };

      service.getKPIs(params).subscribe((response) => {
        expect(response.work.totalHours).toBe(160);
        expect(response.break_stats.totalBreakHours).toBe(20);
        expect(response.hours_chart.labels.length).toBe(5);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/kpis`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('filter_type')).toBe('teams');
      expect(req.request.params.get('period')).toBe('week');
      req.flush(mockKPIResponse);
    });

    it('should include entity_id when provided', () => {
      const params = {
        filter_type: 'teams' as const,
        period: 'month' as const,
        entity_id: 'team-123',
      };

      service.getKPIs(params).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/kpis`);
      expect(req.request.params.get('entity_id')).toBe('team-123');
      req.flush(mockKPIResponse);
    });

    it('should include start_date and end_date when provided', () => {
      const params = {
        filter_type: 'employees' as const,
        period: 'day' as const,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      service.getKPIs(params).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/kpis`);
      expect(req.request.params.get('start_date')).toBe('2024-01-01');
      expect(req.request.params.get('end_date')).toBe('2024-01-31');
      req.flush(mockKPIResponse);
    });

    it('should include all params when provided', () => {
      const params = {
        filter_type: 'employees' as const,
        period: 'year' as const,
        entity_id: 'emp-456',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      service.getKPIs(params).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/kpis`);
      expect(req.request.params.get('filter_type')).toBe('employees');
      expect(req.request.params.get('period')).toBe('year');
      expect(req.request.params.get('entity_id')).toBe('emp-456');
      expect(req.request.params.get('start_date')).toBe('2024-01-01');
      expect(req.request.params.get('end_date')).toBe('2024-12-31');
      req.flush(mockKPIResponse);
    });
  });

  describe('helper methods', () => {
    it('getTodayDate should return date in YYYY-MM-DD format', () => {
      const today = service.getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('getDateDaysAgo should return correct date', () => {
      const daysAgo = service.getDateDaysAgo(7);
      expect(daysAgo).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const today = new Date();
      const expected = new Date(today);
      expected.setDate(expected.getDate() - 7);
      expect(daysAgo).toBe(expected.toISOString().split('T')[0]);
    });

    it('getDefaultDateRange should return 30 days range', () => {
      const range = service.getDefaultDateRange();

      expect(range.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end_date).toBe(service.getTodayDate());
      expect(range.start_date).toBe(service.getDateDaysAgo(30));
    });
  });
});
