import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ReportsComponent } from './reports.component';
import { ReportService } from '../../services/report.service';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let consoleSpy: jest.SpyInstance;

  let reportServiceMock: {
    getReports: jest.Mock;
    generateReport: jest.Mock;
    calculateDateRange: jest.Mock;
    generateFilename: jest.Mock;
    downloadFile: jest.Mock;
  };
  let teamServiceMock: { getAllTeams: jest.Mock };
  let userServiceMock: { getAllUsers: jest.Mock };

  const mockReportResponse = {
    kpis: [
      {
        title: 'Heures totales',
        value: '160h',
        change: 5,
        trend: 'up',
        color: 'primary',
      },
      {
        title: 'Taux de présence',
        value: '95%',
        change: -2,
        trend: 'down',
        color: 'success',
      },
    ],
    employeePerformances: [
      {
        id: 'emp-1',
        name: 'John Doe',
        totalHours: 40,
        avgHoursPerDay: 8,
        attendanceRate: 95,
        lateCount: 2,
        onTimeRate: 90,
        status: 'good',
      },
    ],
    teamPerformances: [
      {
        id: 'team-1',
        name: 'Dev Team',
        memberCount: 5,
        avgHours: 38,
        attendanceRate: 92,
        productivity: 85,
      },
    ],
    summary: {
      topPerformer: { name: 'John Doe', totalHours: 45, attendanceRate: 98 },
      bestTeam: { name: 'Dev Team', attendanceRate: 95, productivity: 90 },
      attentionPoints: {
        message: '3 retards cette semaine',
        change: 10,
        trend: 'up',
      },
    },
  };

  const mockTeams = [
    { id: 'team-1', name: 'Dev Team', description: '', manager: 'mgr-1' },
    { id: 'team-2', name: 'QA Team', description: '', manager: 'mgr-2' },
  ];

  const mockUsers = [
    {
      id: 'user-1',
      email: 'john@test.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'EMPLOYEE',
    },
    {
      id: 'user-2',
      email: 'jane@test.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'EMPLOYEE',
    },
  ];

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    reportServiceMock = {
      getReports: jest.fn().mockReturnValue(of(mockReportResponse)),
      generateReport: jest.fn().mockReturnValue(of(new Blob(['test']))),
      calculateDateRange: jest
        .fn()
        .mockReturnValue({ start_date: '2024-01-01', end_date: '2024-01-31' }),
      generateFilename: jest
        .fn()
        .mockReturnValue('rapport_global_month_2024-01-31.pdf'),
      downloadFile: jest.fn(),
    };

    teamServiceMock = {
      getAllTeams: jest.fn().mockReturnValue(of(mockTeams)),
    };

    userServiceMock = {
      getAllUsers: jest.fn().mockReturnValue(of(mockUsers)),
    };

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        { provide: ReportService, useValue: reportServiceMock },
        { provide: TeamService, useValue: teamServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ReportsComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load teams, employees, and reports', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
      expect(reportServiceMock.getReports).toHaveBeenCalled();
    }));

    it('should populate teams and employees', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.teams().length).toBe(2);
      expect(component.employees().length).toBe(2);
      expect(component.employees()[0].name).toBe('John Doe');
    }));

    it('should populate KPIs from response', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.kpis().length).toBe(2);
      expect(component.kpis()[0].title).toBe('Heures totales');
    }));

    it('should handle error when loading reports', fakeAsync(() => {
      reportServiceMock.getReports.mockReturnValue(
        throwError(() => ({ message: 'API Error' }))
      );

      fixture.detectChanges();
      tick();

      expect(component.errorMessage()).toBe('API Error');
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('showTeamSelect should be true only for team report type', () => {
      component.selectedReportType.set('global');
      expect(component.showTeamSelect()).toBe(false);

      component.selectedReportType.set('team');
      expect(component.showTeamSelect()).toBe(true);

      component.selectedReportType.set('individual');
      expect(component.showTeamSelect()).toBe(false);
    });

    it('showEmployeeSelect should be true only for individual report type', () => {
      component.selectedReportType.set('global');
      expect(component.showEmployeeSelect()).toBe(false);

      component.selectedReportType.set('individual');
      expect(component.showEmployeeSelect()).toBe(true);
    });
  });

  describe('loadReports', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call getReports with correct params', fakeAsync(() => {
      reportServiceMock.getReports.mockClear();
      component.selectedPeriod.set('week');
      component.selectedReportType.set('global');

      component.loadReports();
      tick();

      expect(reportServiceMock.getReports).toHaveBeenCalledWith({
        period: 'week',
        report_type: 'global',
      });
    }));

    it('should include team_id for team reports', fakeAsync(() => {
      reportServiceMock.getReports.mockClear();
      component.selectedReportType.set('team');
      component.selectedTeamId.set('team-1');

      component.loadReports();
      tick();

      expect(reportServiceMock.getReports).toHaveBeenCalledWith(
        expect.objectContaining({ team_id: 'team-1' })
      );
    }));

    it('should include employee_id for individual reports', fakeAsync(() => {
      reportServiceMock.getReports.mockClear();
      component.selectedReportType.set('individual');
      component.selectedEmployeeId.set('user-1');

      component.loadReports();
      tick();

      expect(reportServiceMock.getReports).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 'user-1' })
      );
    }));
  });

  describe('onReportTypeChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset selections and reload', fakeAsync(() => {
      component.selectedTeamId.set('team-1');
      component.selectedEmployeeId.set('user-1');
      reportServiceMock.getReports.mockClear();

      component.onReportTypeChange();
      tick();

      expect(component.selectedTeamId()).toBeNull();
      expect(component.selectedEmployeeId()).toBeNull();
      expect(reportServiceMock.getReports).toHaveBeenCalled();
    }));
  });

  describe('exportReport', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call generateReport and downloadFile on success', fakeAsync(() => {
      component.exportReport();
      tick();

      expect(reportServiceMock.generateReport).toHaveBeenCalled();
      expect(reportServiceMock.downloadFile).toHaveBeenCalled();
      expect(component.isExporting()).toBe(false);
    }));

    it('should handle export error', fakeAsync(() => {
      reportServiceMock.generateReport.mockReturnValue(
        throwError(() => ({ message: 'Export failed' }))
      );

      component.exportReport();
      tick();

      expect(component.errorMessage()).toBe('Export failed');
      expect(component.isExporting()).toBe(false);
    }));
  });

  describe('Helper methods', () => {
    it('getStatusBadgeClass should return correct class', () => {
      expect(component.getStatusBadgeClass('excellent')).toBe('badge-success');
      expect(component.getStatusBadgeClass('good')).toBe('badge-info');
      expect(component.getStatusBadgeClass('warning')).toBe('badge-warning');
      expect(component.getStatusBadgeClass('poor')).toBe('badge-error');
      expect(component.getStatusBadgeClass('unknown')).toBe('badge-secondary');
    });

    it('getStatusLabel should return correct label', () => {
      expect(component.getStatusLabel('excellent')).toBe('Excellent');
      expect(component.getStatusLabel('good')).toBe('Bon');
      expect(component.getStatusLabel('warning')).toBe('Attention');
      expect(component.getStatusLabel('poor')).toBe('Insuffisant');
      expect(component.getStatusLabel('unknown')).toBe('N/A');
    });

    it('getKpiColorClass should return correct class', () => {
      expect(component.getKpiColorClass('primary')).toContain('primary');
      expect(component.getKpiColorClass('success')).toContain('green');
      expect(component.getKpiColorClass('warning')).toContain('yellow');
      expect(component.getKpiColorClass('error')).toContain('red');
      expect(component.getKpiColorClass('unknown')).toContain('gray');
    });
  });

  describe('Initial state', () => {
    it('should have correct default values', () => {
      expect(component.isLoading()).toBe(false);
      expect(component.isExporting()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.selectedPeriod()).toBe('month');
      expect(component.selectedReportType()).toBe('global');
      expect(component.selectedTeamId()).toBeNull();
      expect(component.selectedEmployeeId()).toBeNull();
      expect(component.selectedExportFormat()).toBe('pdf');
    });
  });
});
