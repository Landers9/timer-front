import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClockComponent } from './clock.component';
import { ClockService, ApiClockRecord } from '../../services/clock.service';
import { UserService } from '../../services/user.service';

describe('ClockComponent', () => {
  let component: ClockComponent;
  let fixture: ComponentFixture<ClockComponent>;
  let consoleSpy: jest.SpyInstance;

  let clockServiceMock: {
    getUserClocks: jest.Mock;
  };
  let userServiceMock: {
    getCurrentUser: jest.Mock;
  };
  let routerMock: {
    navigate: jest.Mock;
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'EMPLOYEE',
  };

  const mockClockRecords: ApiClockRecord[] = [
    {
      id: 'clock-1',
      user: 'user-1',
      clock_in_time: '2024-01-15T09:00:00Z',
      clock_out_time: '2024-01-15T18:00:00Z',
      break_in_time: '2024-01-15T12:00:00Z',
      break_out_time: '2024-01-15T13:00:00Z',
      location: '48.8566,2.3522',
    },
    {
      id: 'clock-2',
      user: 'user-1',
      clock_in_time: '2024-01-16T08:30:00Z',
      clock_out_time: null,
      break_in_time: null,
      break_out_time: null,
      location: '48.8566,2.3522',
    },
  ];

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    clockServiceMock = {
      getUserClocks: jest.fn().mockReturnValue(of(mockClockRecords)),
    };

    userServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of(mockUser)),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClockComponent],
      providers: [
        { provide: ClockService, useValue: clockServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ClockComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClockComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(userServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUserId()).toBe('user-1');
    }));

    it('should load clock history after getting user', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(clockServiceMock.getUserClocks).toHaveBeenCalledWith('user-1');
      expect(component.clockHistory().length).toBe(2);
    }));

    it('should handle error when loading user fails', fakeAsync(() => {
      userServiceMock.getCurrentUser.mockReturnValue(
        throwError(() => new Error('User error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.errorMessage()).toBe(
        'Impossible de charger les informations utilisateur'
      );
    }));
  });

  describe('loadClockHistory', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set loading to true then false', fakeAsync(() => {
      clockServiceMock.getUserClocks.mockClear();
      clockServiceMock.getUserClocks.mockReturnValue(of(mockClockRecords));

      component.loadClockHistory('user-1');

      // Note: of() completes synchronously, so we check final state
      tick();
      expect(component.isLoading()).toBe(false);
    }));

    it('should map API records to display format', fakeAsync(() => {
      const history = component.clockHistory();

      expect(history[0].id).toBe('clock-1');
      expect(history[0].status).toBe('completed');
      expect(history[1].status).toBe('in-progress');
    }));

    it('should handle error when loading history fails', fakeAsync(() => {
      clockServiceMock.getUserClocks.mockReturnValue(
        throwError(() => new Error('API error'))
      );

      component.loadClockHistory('user-1');
      tick();

      expect(component.errorMessage()).toBe('API error');
      expect(component.isLoading()).toBe(false);
    }));

    it('should display generic error when no message', fakeAsync(() => {
      clockServiceMock.getUserClocks.mockReturnValue(throwError(() => ({})));

      component.loadClockHistory('user-1');
      tick();

      expect(component.errorMessage()).toBe(
        "Erreur lors du chargement de l'historique"
      );
    }));

    it('should clear error message before loading', fakeAsync(() => {
      component.errorMessage.set('Previous error');

      component.loadClockHistory('user-1');
      tick();

      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('goToClockAction', () => {
    it('should navigate to clock-action page', () => {
      component.goToClockAction();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/clock-action']);
    });
  });

  describe('refreshHistory', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reload clock history', fakeAsync(() => {
      clockServiceMock.getUserClocks.mockClear();

      component.refreshHistory();
      tick();

      expect(clockServiceMock.getUserClocks).toHaveBeenCalledWith('user-1');
    }));

    it('should not reload if no user id', fakeAsync(() => {
      component.currentUserId.set(null);
      clockServiceMock.getUserClocks.mockClear();

      component.refreshHistory();
      tick();

      expect(clockServiceMock.getUserClocks).not.toHaveBeenCalled();
    }));
  });

  describe('dismissError', () => {
    it('should clear error message', () => {
      component.errorMessage.set('Some error');

      component.dismissError();

      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return success class for completed', () => {
      const result = component.getStatusBadgeClass('completed');
      expect(result).toContain('success');
    });

    it('should return warning class for in-progress', () => {
      const result = component.getStatusBadgeClass('in-progress');
      expect(result).toContain('warning');
    });
  });

  describe('Clock history display mapping', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format times correctly for completed session', () => {
      const completedEntry = component.clockHistory()[0];

      expect(completedEntry.clockInTime).not.toBe('--:--');
      expect(completedEntry.clockOutTime).not.toBe('--:--');
      expect(completedEntry.breakInTime).not.toBe('--:--');
      expect(completedEntry.breakOutTime).not.toBe('--:--');
      expect(completedEntry.status).toBe('completed');
    });

    it('should show -- for missing times in progress session', () => {
      const inProgressEntry = component.clockHistory()[1];

      expect(inProgressEntry.clockOutTime).toBe('--:--');
      expect(inProgressEntry.breakInTime).toBe('--:--');
      expect(inProgressEntry.breakOutTime).toBe('--:--');
      expect(inProgressEntry.status).toBe('in-progress');
    });

    it('should calculate total hours for completed session', () => {
      const completedEntry = component.clockHistory()[0];

      // 9h à 18h = 9h, moins 1h pause = 8h
      expect(completedEntry.totalHours).toBe('08:00');
    });
  });

  describe('Initial state', () => {
    it('should have empty clock history', () => {
      expect(component.clockHistory()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have no error message', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('should have null user id', () => {
      expect(component.currentUserId()).toBeNull();
    });
  });
});
