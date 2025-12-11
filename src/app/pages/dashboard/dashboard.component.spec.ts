import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { ChartService } from '../../services/chart.service';
import { StatsService, KPIResponse } from '../../services/stats.service';
import { TeamService, ApiTeam } from '../../services/team.service';
import { UserService, ApiUser } from '../../services/user.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let consoleSpy: jest.SpyInstance;

  let authServiceMock: {
    currentUser: jest.Mock;
  };
  let chartServiceMock: {
    createChart: jest.Mock;
    destroyChart: jest.Mock;
  };
  let statsServiceMock: {
    getDefaultDateRange: jest.Mock;
    getKPIs: jest.Mock;
  };
  let teamServiceMock: {
    getAllTeams: jest.Mock;
  };
  let userServiceMock: {
    getAllUsers: jest.Mock;
  };

  const mockKPIResponse: KPIResponse = {
    work: {
      totalHours: 160,
      avgHoursPerDay: 8,
      attendanceRate: 95,
      avgArrivalTime: '08:30',
      trend: 'up',
    },
    break_stats: {
      totalBreakHours: 20,
      avgBreakPerDay: 1,
      breakComplianceRate: 90,
      avgBreakTime: '12:30',
      trend: 'stable',
    },
    hours_chart: {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
      data: [8, 7.5, 8.5, 8, 7],
    },
    attendance_chart: {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
      data: [100, 95, 100, 90, 95],
    },
  };

  const mockTeams: ApiTeam[] = [
    { id: 'team-1', name: 'Équipe Dev', description: 'Dev', manager: 'mgr-1' },
    {
      id: 'team-2',
      name: 'Équipe Design',
      description: 'Design',
      manager: 'mgr-1',
    },
  ];

  const mockUsers: ApiUser[] = [
    {
      id: 'user-1',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: null,
      role: 'EMPLOYEE',
      is_active: true,
      is_verified: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      device_id: null,
      fingerprint_id: null,
      position: null,
      department: null,
      hire_date: null,
      created_by: null,
    },
  ];

  const mockChart = {
    data: {
      labels: [],
      datasets: [{ data: [], label: '', backgroundColor: '', borderColor: '' }],
    },
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    authServiceMock = {
      currentUser: jest.fn().mockReturnValue({
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        role: 'MANAGER',
      }),
    };

    chartServiceMock = {
      createChart: jest.fn().mockReturnValue(mockChart),
      destroyChart: jest.fn(),
    };

    statsServiceMock = {
      getDefaultDateRange: jest.fn().mockReturnValue({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      }),
      getKPIs: jest.fn().mockReturnValue(of(mockKPIResponse)),
    };

    teamServiceMock = {
      getAllTeams: jest.fn().mockReturnValue(of(mockTeams)),
    };

    userServiceMock = {
      getAllUsers: jest.fn().mockReturnValue(of(mockUsers)),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ChartService, useValue: chartServiceMock },
        { provide: StatsService, useValue: statsServiceMock },
        { provide: TeamService, useValue: teamServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DashboardComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    // Mock ViewChild refs
    component.hoursChartRef = {
      nativeElement: document.createElement('canvas'),
    } as ElementRef;
    component.attendanceChartRef = {
      nativeElement: document.createElement('canvas'),
    } as ElementRef;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize dates from statsService', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(statsServiceMock.getDefaultDateRange).toHaveBeenCalled();
      expect(component.startDate()).toBe('2024-01-01');
      expect(component.endDate()).toBe('2024-01-31');
    }));

    it('should load teams', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
      expect(component.teams().length).toBe(2);
    }));

    it('should load employees', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
      expect(component.employees().length).toBe(1);
    }));

    it('should handle error when loading teams fails', fakeAsync(() => {
      teamServiceMock.getAllTeams.mockReturnValue(
        throwError(() => new Error('Erreur'))
      );

      fixture.detectChanges();
      tick();

      expect(component.teams().length).toBe(0);
    }));

    it('should handle error when loading employees fails', fakeAsync(() => {
      userServiceMock.getAllUsers.mockReturnValue(
        throwError(() => new Error('Erreur'))
      );

      fixture.detectChanges();
      tick();

      expect(component.employees().length).toBe(0);
    }));
  });

  describe('ngAfterViewInit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should initialize charts', () => {
      // Clear previous calls from beforeEach's detectChanges
      chartServiceMock.createChart.mockClear();

      component.ngAfterViewInit();

      expect(chartServiceMock.createChart).toHaveBeenCalledTimes(2);
    });

    it('should load KPIs after charts init', fakeAsync(() => {
      component.ngAfterViewInit();
      tick();

      expect(statsServiceMock.getKPIs).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should destroy charts', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.ngAfterViewInit();

      component.ngOnDestroy();

      expect(chartServiceMock.destroyChart).toHaveBeenCalledTimes(2);
    }));
  });

  describe('loadKPIs', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set loading to true then false', fakeAsync(() => {
      const subject = new Subject<KPIResponse>();
      statsServiceMock.getKPIs.mockReturnValue(subject.asObservable());

      component.loadKPIs();

      expect(component.isLoading()).toBe(true);

      subject.next(mockKPIResponse);
      subject.complete();
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should update stats from response', fakeAsync(() => {
      component.loadKPIs();
      tick();

      expect(component.stats().totalHours).toBe(160);
      expect(component.stats().attendanceRate).toBe(95);
    }));

    it('should update breakStats from response', fakeAsync(() => {
      component.loadKPIs();
      tick();

      expect(component.breakStats().totalBreakHours).toBe(20);
      expect(component.breakStats().breakComplianceRate).toBe(90);
    }));

    it('should update chart data', fakeAsync(() => {
      component.loadKPIs();
      tick();

      expect(component.hoursChartData().labels.length).toBe(5);
      expect(component.attendanceChartData().data.length).toBe(5);
    }));

    it('should handle error', fakeAsync(() => {
      statsServiceMock.getKPIs.mockReturnValue(
        throwError(() => new Error('Erreur API'))
      );

      component.loadKPIs();
      tick();

      expect(component.errorMessage()).toBe('Erreur API');
      expect(component.isLoading()).toBe(false);
    }));

    it('should pass correct params', fakeAsync(() => {
      component.filterType.set('employees');
      component.selectedEntityId.set('user-1');
      component.hoursPeriod.set('month');

      component.loadKPIs();
      tick();

      expect(statsServiceMock.getKPIs).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_type: 'employees',
          entity_id: 'user-1',
          period: 'month',
        })
      );
    }));
  });

  describe('Filter handlers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('onFilterTypeChange should update filterType and reload', fakeAsync(() => {
      const loadSpy = jest.spyOn(component, 'loadKPIs');

      component.onFilterTypeChange('employees');
      tick();

      expect(component.filterType()).toBe('employees');
      expect(component.selectedEntityId()).toBeNull();
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('onEntityChange should update entity and reload', fakeAsync(() => {
      const loadSpy = jest.spyOn(component, 'loadKPIs');

      component.onEntityChange('team-1');
      tick();

      expect(component.selectedEntityId()).toBe('team-1');
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('onHoursPeriodChange should update period and reload', fakeAsync(() => {
      const loadSpy = jest.spyOn(component, 'loadKPIs');

      component.onHoursPeriodChange('month');
      tick();

      expect(component.hoursPeriod()).toBe('month');
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('onAttendancePeriodChange should update period and reload', fakeAsync(() => {
      const loadSpy = jest.spyOn(component, 'loadKPIs');

      component.onAttendancePeriodChange('year');
      tick();

      expect(component.attendancePeriod()).toBe('year');
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('onStartDateChange should update date and reload', fakeAsync(() => {
      const loadSpy = jest.spyOn(component, 'loadKPIs');

      component.onStartDateChange('2024-02-01');
      tick();

      expect(component.startDate()).toBe('2024-02-01');
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('onEndDateChange should update date and reload', fakeAsync(() => {
      const loadSpy = jest.spyOn(component, 'loadKPIs');

      component.onEndDateChange('2024-02-28');
      tick();

      expect(component.endDate()).toBe('2024-02-28');
      expect(loadSpy).toHaveBeenCalled();
    }));
  });

  describe('toggleDataView', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.ngAfterViewInit();
      tick();
    }));

    it('should toggle between work and break', () => {
      expect(component.dataView()).toBe('work');

      component.toggleDataView();
      expect(component.dataView()).toBe('break');

      component.toggleDataView();
      expect(component.dataView()).toBe('work');
    });
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('currentUser should return user from auth', () => {
      expect(component.currentUser()?.first_name).toBe('John');
    });

    it('isManager should return true for MANAGER', () => {
      expect(component.isManager()).toBe(true);
    });

    it('isManager should return true for ADMIN', async () => {
      // Computed signals capture value at creation time
      authServiceMock.currentUser.mockReturnValue({
        id: 'user-1',
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
      });

      const newFixture = TestBed.createComponent(DashboardComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.isManager()).toBe(true);
    });

    it('isManager should return false for EMPLOYEE', async () => {
      // Computed signals capture value at creation time
      // Need to recreate component with EMPLOYEE role
      authServiceMock.currentUser.mockReturnValue({ role: 'EMPLOYEE' });

      // Recreate fixture with new mock value
      const newFixture = TestBed.createComponent(DashboardComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.isManager()).toBe(false);
    });

    it('userName should return full name', () => {
      expect(component.userName()).toBe('John Doe');
    });

    it('entitiesList should return teams when filterType is teams', () => {
      component.filterType.set('teams');
      expect(component.entitiesList()).toEqual(component.teams());
    });

    it('entitiesList should return employees when filterType is employees', () => {
      component.filterType.set('employees');
      expect(component.entitiesList()).toEqual(component.employees());
    });

    it('currentStats should return work stats by default', fakeAsync(() => {
      component.loadKPIs();
      tick();

      const stats = component.currentStats();
      expect(stats.label1).toBe('Heures totales');
      expect(stats.value1).toBe('160h');
    }));

    it('currentStats should return break stats when dataView is break', fakeAsync(() => {
      component.loadKPIs();
      tick();
      component.dataView.set('break');

      const stats = component.currentStats();
      expect(stats.label1).toBe('Pauses totales');
      expect(stats.value1).toBe('20h');
    }));
  });

  describe('getEntityDisplayName', () => {
    it('should return name for team', () => {
      const team = { id: '1', name: 'Team A' };
      expect(component.getEntityDisplayName(team)).toBe('Team A');
    });

    it('should return full name for employee', () => {
      const employee = { id: '1', firstName: 'John', lastName: 'Doe' };
      expect(component.getEntityDisplayName(employee)).toBe('John Doe');
    });
  });

  describe('formattedDate', () => {
    it('should format current date in French', () => {
      const formatted = component.formattedDate();
      expect(formatted).toContain('2'); // Contains day number
    });
  });
});
