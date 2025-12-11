import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { environment } from '../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/reports`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReports', () => {
    const mockReportResponse = {
      kpis: [
        {
          title: 'Heures totales',
          value: '160h',
          change: 5,
          trend: 'up' as const,
          color: 'primary' as const,
        },
      ],
      employeePerformances: [
        {
          id: 'emp-1',
          name: 'John Doe',
          totalHours: 40,
          avgHoursPerDay: 8,
          attendanceRate: 95,
          lateCount: 1,
          onTimeRate: 90,
          status: 'good' as const,
        },
      ],
      teamPerformances: [
        {
          id: 'team-1',
          name: 'Dev Team',
          memberCount: 5,
          avgHours: 40,
          attendanceRate: 95,
          productivity: 90,
        },
      ],
      summary: {
        topPerformer: { name: 'Jane Doe', totalHours: 45, attendanceRate: 100 },
        bestTeam: { name: 'Dev Team', attendanceRate: 98, productivity: 95 },
        attentionPoints: {
          message: 'Retards en hausse',
          change: 10,
          trend: 'up' as const,
        },
      },
    };

    it('should GET /reports/ with required params', () => {
      const params = {
        period: 'week' as const,
        report_type: 'global' as const,
      };

      service.getReports(params).subscribe((response) => {
        expect(response.kpis.length).toBe(1);
        expect(response.employeePerformances.length).toBe(1);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('period')).toBe('week');
      expect(req.request.params.get('report_type')).toBe('global');
      req.flush(mockReportResponse);
    });

    it('should include team_id when provided', () => {
      const params = {
        period: 'month' as const,
        report_type: 'team' as const,
        team_id: 'team-123',
      };

      service.getReports(params).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/`);
      expect(req.request.params.get('team_id')).toBe('team-123');
      req.flush(mockReportResponse);
    });

    it('should include employee_id when provided', () => {
      const params = {
        period: 'quarter' as const,
        report_type: 'individual' as const,
        employee_id: 'emp-456',
      };

      service.getReports(params).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/`);
      expect(req.request.params.get('employee_id')).toBe('emp-456');
      req.flush(mockReportResponse);
    });
  });

  describe('generateReport', () => {
    it('should POST /reports/generate/ and return Blob', () => {
      const request = {
        report_type: 'global' as const,
        format: 'pdf' as const,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.generateReport(request).subscribe((blob) => {
        expect(blob).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`${apiUrl}/generate/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('calculateDateRange', () => {
    it('should calculate week range (7 days)', () => {
      const range = service.calculateDateRange('week');

      expect(range.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      const diffDays = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBe(7);
    });

    it('should calculate month range', () => {
      const range = service.calculateDateRange('month');

      expect(range.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it('should calculate quarter range', () => {
      const range = service.calculateDateRange('quarter');

      expect(range.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it('should calculate year range', () => {
      const range = service.calculateDateRange('year');

      expect(range.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filename', () => {
      const filename = service.generateFilename('global', 'pdf', 'week');
      const dateStr = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`rapport_global_week_${dateStr}.pdf`);
    });

    it('should handle different formats', () => {
      const pdfFilename = service.generateFilename('team', 'pdf', 'month');
      const xlsxFilename = service.generateFilename(
        'individual',
        'xlsx',
        'quarter'
      );
      const csvFilename = service.generateFilename('global', 'csv', 'year');

      expect(pdfFilename).toContain('.pdf');
      expect(xlsxFilename).toContain('.xlsx');
      expect(csvFilename).toContain('.csv');
    });
  });
});
