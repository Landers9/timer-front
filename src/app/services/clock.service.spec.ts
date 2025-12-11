import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ClockService, ClockState } from './clock.service';
import { environment } from '../../environments/environment';

describe('ClockService', () => {
  let service: ClockService;
  let httpMock: HttpTestingController;
  const clocksApiUrl = `${environment.apiUrl}/clocks`;
  const usersApiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('clockAction', () => {
    it('should POST /clocks/ with action and location', () => {
      const location = { latitude: 48.8566, longitude: 2.3522 };
      const mockResponse = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: null,
        break_in_time: null,
        break_out_time: null,
        location: '48.8566,2.3522',
      };

      service.clockAction('clock_in', location).subscribe((record) => {
        expect(record.id).toBe('clock-1');
        expect(record.clock_in_time).toBeTruthy();
      });

      const req = httpMock.expectOne(`${clocksApiUrl}/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ action: 'clock_in', location });
      req.flush(mockResponse);
    });
  });

  describe('getCurrentClock', () => {
    it('should GET /users/clocks/current/', () => {
      const mockResponse = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: null,
        break_in_time: null,
        break_out_time: null,
        location: '48.8566,2.3522',
      };

      service.getCurrentClock().subscribe((record) => {
        expect(record).toBeTruthy();
        expect(record?.id).toBe('clock-1');
      });

      const req = httpMock.expectOne(`${usersApiUrl}/clocks/current/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when 404', () => {
      service.getCurrentClock().subscribe((record) => {
        expect(record).toBeNull();
      });

      const req = httpMock.expectOne(`${usersApiUrl}/clocks/current/`);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getUserClocks', () => {
    it('should GET /users/{id}/clocks/', () => {
      const mockResponse = {
        count: 2,
        next: false,
        previous: false,
        results: [
          {
            id: 'clock-1',
            user: 'user-1',
            clock_in_time: '2024-01-15T09:00:00Z',
            clock_out_time: '2024-01-15T17:00:00Z',
          },
          {
            id: 'clock-2',
            user: 'user-1',
            clock_in_time: '2024-01-14T09:00:00Z',
            clock_out_time: '2024-01-14T17:00:00Z',
          },
        ],
        code: 200,
      };

      service.getUserClocks('user-1').subscribe((clocks) => {
        expect(clocks.length).toBe(2);
        expect(clocks[0].id).toBe('clock-1');
      });

      const req = httpMock.expectOne(`${usersApiUrl}/user-1/clocks/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('determineClockState', () => {
    it('should return NO_SESSION when record is null', () => {
      const state = service.determineClockState(null);
      expect(state).toBe(ClockState.NO_SESSION);
    });

    it('should return NO_SESSION when clock_in_time is null', () => {
      const record = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: null,
        clock_out_time: null,
        break_in_time: null,
        break_out_time: null,
        location: '',
      };
      const state = service.determineClockState(record);
      expect(state).toBe(ClockState.NO_SESSION);
    });

    it('should return DAY_COMPLETED when clock_out_time exists', () => {
      const record = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: '2024-01-15T17:00:00Z',
        break_in_time: null,
        break_out_time: null,
        location: '',
      };
      const state = service.determineClockState(record);
      expect(state).toBe(ClockState.DAY_COMPLETED);
    });

    it('should return ON_BREAK when break_in exists but not break_out', () => {
      const record = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: null,
        break_in_time: '2024-01-15T12:00:00Z',
        break_out_time: null,
        location: '',
      };
      const state = service.determineClockState(record);
      expect(state).toBe(ClockState.ON_BREAK);
    });

    it('should return BACK_FROM_BREAK when both break_in and break_out exist', () => {
      const record = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: null,
        break_in_time: '2024-01-15T12:00:00Z',
        break_out_time: '2024-01-15T12:30:00Z',
        location: '',
      };
      const state = service.determineClockState(record);
      expect(state).toBe(ClockState.BACK_FROM_BREAK);
    });

    it('should return WORKING when clock_in exists with no break', () => {
      const record = {
        id: 'clock-1',
        user: 'user-1',
        clock_in_time: '2024-01-15T09:00:00Z',
        clock_out_time: null,
        break_in_time: null,
        break_out_time: null,
        location: '',
      };
      const state = service.determineClockState(record);
      expect(state).toBe(ClockState.WORKING);
    });
  });
});
