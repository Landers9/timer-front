import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClockActionComponent } from './clock-action.component';
import {
  ClockService,
  ClockState,
  ApiClockRecord,
} from '../../services/clock.service';
import { UserService } from '../../services/user.service';

describe('ClockActionComponent', () => {
  let component: ClockActionComponent;
  let fixture: ComponentFixture<ClockActionComponent>;
  let consoleSpy: jest.SpyInstance;

  let clockServiceMock: {
    getCurrentClock: jest.Mock;
    clockAction: jest.Mock;
    determineClockState: jest.Mock;
    getCurrentLocation: jest.Mock;
  };
  let routerMock: { navigate: jest.Mock };

  const mockClockRecord: ApiClockRecord = {
    id: 'clock-1',
    user: 'user-1',
    clock_in_time: '2024-01-15T09:00:00Z',
    clock_out_time: null,
    break_in_time: null,
    break_out_time: null,
    location: '48.8566,2.3522',
  };

  let localStorageMock: { [key: string]: string } = {};

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    localStorageMock = {};
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key) => localStorageMock[key] || null);
    jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key, value) => {
        localStorageMock[key] = value;
      });

    clockServiceMock = {
      getCurrentClock: jest.fn().mockReturnValue(of(null)),
      clockAction: jest.fn().mockReturnValue(of(mockClockRecord)),
      determineClockState: jest.fn().mockReturnValue(ClockState.NO_SESSION),
      getCurrentLocation: jest
        .fn()
        .mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 }),
    };

    routerMock = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClockActionComponent],
      providers: [
        { provide: ClockService, useValue: clockServiceMock },
        {
          provide: UserService,
          useValue: {
            getCurrentUser: jest.fn().mockReturnValue(of({ id: 'user-1' })),
          },
        },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ClockActionComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClockActionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current clock status', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(clockServiceMock.getCurrentClock).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should set NO_SESSION when no active clock', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.clockState()).toBe(ClockState.NO_SESSION);
      discardPeriodicTasks();
    }));

    it('should sync state when clock exists', fakeAsync(() => {
      clockServiceMock.getCurrentClock.mockReturnValue(of(mockClockRecord));
      clockServiceMock.determineClockState.mockReturnValue(ClockState.WORKING);

      fixture.detectChanges();
      tick();

      expect(component.clockState()).toBe(ClockState.WORKING);
      discardPeriodicTasks();
    }));

    it('should handle error loading clock status', fakeAsync(() => {
      clockServiceMock.getCurrentClock.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.isLoading()).toBe(false);
      discardPeriodicTasks();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should clear interval and save session', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      discardPeriodicTasks();
    }));

    it('canStartBreak should be true only when WORKING', () => {
      component.clockState.set(ClockState.WORKING);
      expect(component.canStartBreak()).toBe(true);

      component.clockState.set(ClockState.ON_BREAK);
      expect(component.canStartBreak()).toBe(false);
    });

    it('canEndBreak should be true only when ON_BREAK', () => {
      component.clockState.set(ClockState.ON_BREAK);
      expect(component.canEndBreak()).toBe(true);

      component.clockState.set(ClockState.WORKING);
      expect(component.canEndBreak()).toBe(false);
    });

    it('showBreakSection should be true for WORKING or ON_BREAK', () => {
      component.clockState.set(ClockState.WORKING);
      expect(component.showBreakSection()).toBe(true);

      component.clockState.set(ClockState.ON_BREAK);
      expect(component.showBreakSection()).toBe(true);

      component.clockState.set(ClockState.BACK_FROM_BREAK);
      expect(component.showBreakSection()).toBe(false);
    });

    it('workDisplay and breakDisplay should format time correctly', () => {
      component.workTime.set(3661); // 1h 1m 1s
      expect(component.workDisplay()).toBe('01:01:01');

      component.breakTime.set(1800); // 30m
      expect(component.breakDisplay()).toBe('00:30:00');
    });

    it('totalToday should sum work and break time', () => {
      component.workTime.set(3600);
      component.breakTime.set(1800);
      expect(component.totalToday()).toBe('01:30:00');
    });

    it('productivityPercent should calculate correctly', () => {
      component.workTime.set(80);
      component.breakTime.set(20);
      expect(component.productivityPercent()).toBe(80);

      component.workTime.set(0);
      component.breakTime.set(0);
      expect(component.productivityPercent()).toBe(0);
    });

    it('statusMessage should return correct message for each state', () => {
      component.clockState.set(ClockState.WORKING);
      expect(component.statusMessage()).toBe("You're on the clock.");

      component.clockState.set(ClockState.ON_BREAK);
      expect(component.statusMessage()).toBe("You're on break.");

      component.clockState.set(ClockState.BACK_FROM_BREAK);
      expect(component.statusMessage()).toBe("You're back from break.");

      component.clockState.set(ClockState.DAY_COMPLETED);
      expect(component.statusMessage()).toBe('Day completed.');

      component.clockState.set(ClockState.NO_SESSION);
      expect(component.statusMessage()).toBe("You're off the clock.");
    });
  });

  describe('toggleWork', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      discardPeriodicTasks();
    }));

    it('should not perform action when loading', () => {
      component.isLoading.set(true);
      component.toggleWork();
      expect(clockServiceMock.getCurrentLocation).not.toHaveBeenCalled();
    });

    it('should show error when trying to clock out while on break', () => {
      component.clockState.set(ClockState.ON_BREAK);
      component.toggleWork();
      expect(component.errorMessage()).toBe(
        'Veuillez terminer votre pause avant de pointer la sortie.'
      );
    });
  });

  describe('toggleBreak', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      discardPeriodicTasks();
    }));

    it('should not perform action when loading', () => {
      component.isLoading.set(true);
      component.toggleBreak();
      expect(clockServiceMock.getCurrentLocation).not.toHaveBeenCalled();
    });

    it('should show error when already had break (BACK_FROM_BREAK)', fakeAsync(() => {
      component.clockState.set(ClockState.BACK_FROM_BREAK);
      component.toggleBreak();

      expect(component.errorMessage()).toBe(
        'Une seule pause est autorisée par session.'
      );
      tick(3000);
      discardPeriodicTasks();
    }));
  });

  describe('resetDay', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      discardPeriodicTasks();
    }));

    it('should reset all state when confirmed', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      component.workTime.set(3600);
      component.breakTime.set(1800);
      component.clockState.set(ClockState.WORKING);

      component.resetDay();

      expect(component.workTime()).toBe(0);
      expect(component.breakTime()).toBe(0);
      expect(component.clockState()).toBe(ClockState.NO_SESSION);
    });

    it('should not reset when cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.workTime.set(3600);
      component.resetDay();

      expect(component.workTime()).toBe(3600);
    });
  });

  describe('Navigation and helpers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      discardPeriodicTasks();
    }));

    it('goBack should navigate to /clock', () => {
      component.goBack();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/clock']);
    });

    it('dismissError should clear error message', () => {
      component.errorMessage.set('Some error');
      component.dismissError();
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Session persistence', () => {
    it('should load session data from localStorage', () => {
      localStorageMock['clockSession'] = JSON.stringify({
        workStartTime: null,
        breakStartTime: null,
        totalWorkSeconds: 1800,
        totalBreakSeconds: 300,
        isWorkActive: true,
        isBreakActive: false,
        sessions: [],
        lastClockRecord: null,
      });

      fixture = TestBed.createComponent(ClockActionComponent);
      component = fixture.componentInstance;

      expect(component.workTime()).toBe(1800);
      expect(component.breakTime()).toBe(300);
    });

    it('should save session data to localStorage', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.workTime.set(3600);
      component.ngOnDestroy();

      const saved = JSON.parse(localStorageMock['clockSession']);
      expect(saved.totalWorkSeconds).toBe(3600);
      discardPeriodicTasks();
    }));
  });

  describe('Initial state', () => {
    it('should have correct initial values', () => {
      expect(component.workTime()).toBe(0);
      expect(component.breakTime()).toBe(0);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.clockState()).toBe(ClockState.NO_SESSION);
    });
  });
});
