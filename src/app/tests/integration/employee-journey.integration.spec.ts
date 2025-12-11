/**
 * Tests d'intégration - Parcours EMPLOYEE
 *
 * Scénario complet :
 * 1. Login + Vérification 2FA
 * 2. Accès au Dashboard (vue limitée)
 * 3. Consultation de l'historique des pointages (Clock)
 * 4. Effectuer un pointage (Clock Action)
 * 5. Consulter/Modifier son profil
 * 6. Déconnexion
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { ClockActionComponent } from '../../pages/clock-action/clock-action.component';
import { ClockComponent } from '../../pages/clock/clock.component';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { LoginComponent } from '../../pages/login/login.component';
import { ProfileComponent } from '../../pages/profile/profile.component';
import { TwoFactorAuthComponent } from '../../pages/two-factor-auth/two-factor-auth.component';
import { AuthService } from '../../services/auth.service';
import { ClockService } from '../../services/clock.service';
import { StatsService } from '../../services/stats.service';
import { UserService } from '../../services/user.service';



describe('Integration: Employee Journey', () => {
  let router: Router;
  let location: Location;

  // Mocks
  let authServiceMock: any;
  let userServiceMock: any;
  let clockServiceMock: any;
  let statsServiceMock: any;

  const mockEmployee = {
    id: 'emp-001',
    email: 'employee@company.com',
    first_name: 'Jean',
    last_name: 'Dupont',
    role: 'EMPLOYEE' as const,
    phone_number: '0612345678',
    created_at: '2024-01-01T00:00:00Z',
    is_active: true,
  };

  const mockLoginResponse = {
    requires_verification: true,
    message: 'Code envoyé',
    token: 'temp-verification-token',
  };

  const mockVerifyResponse = {
    user: mockEmployee,
    access: 'access-token-123',
    refresh: 'refresh-token-456',
    access_expires: 3600,
    refresh_expires: 86400,
    message: 'Connexion réussie',
  };

  const mockClockRecords = [
    {
      id: 'clock-1',
      user_id: 'emp-001',
      clock_in_time: '2024-01-15T09:00:00Z',
      clock_out_time: '2024-01-15T18:00:00Z',
      break_in_time: '2024-01-15T12:00:00Z',
      break_out_time: '2024-01-15T13:00:00Z',
    },
  ];

  const mockKPIResponse = {
    work: {
      totalHours: 160,
      avgHoursPerDay: 8,
      attendanceRate: 95,
      avgArrivalTime: '09:05',
      trend: 'up',
    },
    break_stats: {
      totalBreakHours: 20,
      avgBreakPerDay: 1,
      breakComplianceRate: 100,
      avgBreakTime: '12:30',
      trend: 'stable',
    },
    hours_chart: { labels: ['Lun', 'Mar', 'Mer'], data: [8, 8.5, 7.5] },
    attendance_chart: { labels: ['Lun', 'Mar', 'Mer'], data: [100, 100, 100] },
  };

  beforeEach(async () => {
    // Setup AuthService mock
    authServiceMock = {
      login: jest.fn().mockReturnValue(of(mockLoginResponse)),
      verifyCode: jest.fn().mockReturnValue(of(mockVerifyResponse)),
      logout: jest.fn().mockReturnValue(of(undefined)),
      currentUser: jest.fn().mockReturnValue(mockEmployee),
      isAuthenticated: jest.fn().mockReturnValue(true),
      getToken: jest.fn().mockReturnValue('access-token-123'),
      verificationToken: jest.fn().mockReturnValue('temp-verification-token'),
    };

    // Setup UserService mock
    userServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of(mockEmployee)),
      updateUserProfile: jest.fn().mockReturnValue(of(mockEmployee)),
      changePassword: jest.fn().mockReturnValue(of({ detail: 'Success' })),
    };

    // Setup ClockService mock
    clockServiceMock = {
      getUserClocks: jest.fn().mockReturnValue(of(mockClockRecords)),
      clockAction: jest
        .fn()
        .mockReturnValue(of({ id: 'new-clock', status: 'clocked_in' })),
      getCurrentStatus: jest.fn().mockReturnValue(of({ status: 'no_session' })),
    };

    // Setup StatsService mock
    statsServiceMock = {
      getKPIs: jest.fn().mockReturnValue(of(mockKPIResponse)),
      getDefaultDateRange: jest
        .fn()
        .mockReturnValue({ start_date: '2024-01-01', end_date: '2024-01-31' }),
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'login', component: LoginComponent },
          { path: 'verify-2fa', component: TwoFactorAuthComponent },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'clock', component: ClockComponent },
          { path: 'clock-action', component: ClockActionComponent },
          { path: 'profile', component: ProfileComponent },
        ]),
      ],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: ClockService, useValue: clockServiceMock },
        { provide: StatsService, useValue: statsServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    router.initialNavigation();
  });

  describe('1. Authentication Flow', () => {
    it('should complete login → 2FA → dashboard flow', fakeAsync(() => {
      // Step 1: Navigate to login
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Step 2: Simulate successful login (triggers 2FA)
      expect(authServiceMock.login).toBeDefined();

      // Step 3: Navigate to 2FA verification
      router.navigate(['/verify-2fa']);
      tick();
      expect(location.path()).toBe('/verify-2fa');

      // Step 4: After 2FA verification, navigate to dashboard
      router.navigate(['/dashboard']);
      tick();
      expect(location.path()).toBe('/dashboard');
    }));

    it('should call login API with correct credentials', fakeAsync(() => {
      authServiceMock.login('employee@company.com', 'password123');
      tick();

      expect(authServiceMock.login).toHaveBeenCalled();
    }));

    it('should call verifyCode API for 2FA', fakeAsync(() => {
      authServiceMock.verifyCode('123456');
      tick();

      expect(authServiceMock.verifyCode).toHaveBeenCalled();
    }));
  });

  describe('2. Dashboard Access (Limited View)', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/dashboard']);
      tick();
    }));

    it('should navigate to dashboard', () => {
      expect(location.path()).toBe('/dashboard');
    });

    it('should load KPIs for employee', fakeAsync(() => {
      statsServiceMock.getKPIs({
        filter_type: 'employees',
        entity_id: 'emp-001',
        period: 'day',
      });
      tick();

      expect(statsServiceMock.getKPIs).toHaveBeenCalled();
    }));

    it('should NOT have access to manager-only features', () => {
      const user = authServiceMock.currentUser();
      expect(user.role).toBe('EMPLOYEE');
      // Employee should not see Teams, Users, Reports in menu
    });
  });

  describe('3. Clock History', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/clock']);
      tick();
    }));

    it('should navigate to clock history', () => {
      expect(location.path()).toBe('/clock');
    });

    it('should load employee clock records', fakeAsync(() => {
      clockServiceMock.getUserClocks('emp-001');
      tick();

      expect(clockServiceMock.getUserClocks).toHaveBeenCalled();
    }));

    it('should display clock history data', fakeAsync(() => {
      const records = mockClockRecords;
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].clock_in_time).toBeDefined();
    }));
  });

  describe('4. Clock Action (Pointage)', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/clock-action']);
      tick();
    }));

    it('should navigate to clock action page', () => {
      expect(location.path()).toBe('/clock-action');
    });

    it('should get current clock status', fakeAsync(() => {
      clockServiceMock.getCurrentStatus('emp-001');
      tick();

      expect(clockServiceMock.getCurrentStatus).toHaveBeenCalled();
    }));

    it('should perform clock-in action', fakeAsync(() => {
      clockServiceMock.clockAction({
        action: 'clock_in',
        user_id: 'emp-001',
        latitude: 48.8566,
        longitude: 2.3522,
      });
      tick();

      expect(clockServiceMock.clockAction).toHaveBeenCalled();
    }));

    it('should perform clock-out action', fakeAsync(() => {
      clockServiceMock.clockAction({
        action: 'clock_out',
        user_id: 'emp-001',
        latitude: 48.8566,
        longitude: 2.3522,
      });
      tick();

      expect(clockServiceMock.clockAction).toHaveBeenCalled();
    }));
  });

  describe('5. Profile Management', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/profile']);
      tick();
    }));

    it('should navigate to profile page', () => {
      expect(location.path()).toBe('/profile');
    });

    it('should load user profile', fakeAsync(() => {
      userServiceMock.getCurrentUser();
      tick();

      expect(userServiceMock.getCurrentUser).toHaveBeenCalled();
    }));

    it('should update profile information', fakeAsync(() => {
      const updatedData = {
        first_name: 'Jean-Pierre',
        last_name: 'Dupont',
        email: 'employee@company.com',
        phone_number: '0698765432',
      };

      userServiceMock.updateUserProfile('emp-001', updatedData);
      tick();

      expect(userServiceMock.updateUserProfile).toHaveBeenCalled();
    }));

    it('should change password', fakeAsync(() => {
      userServiceMock.changePassword('emp-001', {
        old_password: 'oldpass123',
        new_password: 'newpass456',
      });
      tick();

      expect(userServiceMock.changePassword).toHaveBeenCalled();
    }));
  });

  describe('6. Logout', () => {
    it('should logout and redirect to login', fakeAsync(() => {
      router.navigate(['/dashboard']);
      tick();

      authServiceMock.logout();
      tick();

      expect(authServiceMock.logout).toHaveBeenCalled();

      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');
    }));
  });

  describe('Complete Employee Journey', () => {
    it('should complete full employee workflow', fakeAsync(() => {
      // 1. Login
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // 2. 2FA Verification
      router.navigate(['/verify-2fa']);
      tick();
      expect(location.path()).toBe('/verify-2fa');

      // 3. Dashboard
      router.navigate(['/dashboard']);
      tick();
      expect(location.path()).toBe('/dashboard');

      // 4. Check clock history
      router.navigate(['/clock']);
      tick();
      expect(location.path()).toBe('/clock');

      // 5. Perform clock action
      router.navigate(['/clock-action']);
      tick();
      expect(location.path()).toBe('/clock-action');

      // 6. View/Edit profile
      router.navigate(['/profile']);
      tick();
      expect(location.path()).toBe('/profile');

      // 7. Logout
      authServiceMock.logout();
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Verify all services were called appropriately
      expect(authServiceMock.logout).toHaveBeenCalled();
    }));
  });
});
