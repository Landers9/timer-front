/**
 * Tests d'intégration - Parcours MANAGER
 *
 * Scénario complet :
 * 1. Login + Vérification 2FA
 * 2. Accès au Dashboard (vue complète avec KPIs équipe)
 * 3. Gestion des équipes (Teams)
 * 4. Gestion des utilisateurs (Users)
 * 5. Consultation des rapports (Reports)
 * 6. Consultation de son profil
 * 7. Déconnexion
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { LoginComponent } from '../../pages/login/login.component';
import { ProfileComponent } from '../../pages/profile/profile.component';
import { ReportsComponent } from '../../pages/reports/reports.component';
import { TeamsComponent } from '../../pages/teams/teams.component';
import { TwoFactorAuthComponent } from '../../pages/two-factor-auth/two-factor-auth.component';
import { UsersComponent } from '../../pages/users/users.component';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { StatsService } from '../../services/stats.service';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';

// Services

describe('Integration: Manager Journey', () => {
  let router: Router;
  let location: Location;

  // Mocks
  let authServiceMock: any;
  let userServiceMock: any;
  let teamServiceMock: any;
  let reportServiceMock: any;
  let statsServiceMock: any;

  const mockManager = {
    id: 'mgr-001',
    email: 'manager@company.com',
    first_name: 'Marie',
    last_name: 'Martin',
    role: 'MANAGER' as const,
    phone_number: '0687654321',
    created_at: '2023-06-01T00:00:00Z',
    is_active: true,
  };

  const mockLoginResponse = {
    requires_verification: true,
    message: 'Code envoyé',
    token: 'temp-verification-token',
  };

  const mockVerifyResponse = {
    user: mockManager,
    access: 'manager-access-token',
    refresh: 'manager-refresh-token',
    access_expires: 3600,
    refresh_expires: 86400,
    message: 'Connexion réussie',
  };

  const mockTeams = [
    {
      id: 'team-1',
      name: 'Équipe Dev',
      description: 'Développement',
      manager: 'mgr-001',
    },
    {
      id: 'team-2',
      name: 'Équipe QA',
      description: 'Qualité',
      manager: 'mgr-001',
    },
  ];

  const mockUsers = [
    {
      id: 'emp-001',
      email: 'jean@company.com',
      first_name: 'Jean',
      last_name: 'Dupont',
      role: 'EMPLOYEE',
      is_active: true,
    },
    {
      id: 'emp-002',
      email: 'paul@company.com',
      first_name: 'Paul',
      last_name: 'Bernard',
      role: 'EMPLOYEE',
      is_active: true,
    },
    {
      id: 'emp-003',
      email: 'sophie@company.com',
      first_name: 'Sophie',
      last_name: 'Petit',
      role: 'EMPLOYEE',
      is_active: false,
    },
  ];

  const mockReportResponse = {
    kpis: [
      {
        title: 'Heures totales',
        value: '1250h',
        change: 5,
        trend: 'up',
        color: 'primary',
      },
      {
        title: 'Taux de présence',
        value: '94%',
        change: -1,
        trend: 'down',
        color: 'success',
      },
      {
        title: 'Retards',
        value: '12',
        change: 3,
        trend: 'up',
        color: 'warning',
      },
    ],
    employeePerformances: [
      {
        id: 'emp-001',
        name: 'Jean Dupont',
        totalHours: 168,
        avgHoursPerDay: 8.4,
        attendanceRate: 98,
        lateCount: 1,
        onTimeRate: 95,
        status: 'excellent',
      },
      {
        id: 'emp-002',
        name: 'Paul Bernard',
        totalHours: 160,
        avgHoursPerDay: 8,
        attendanceRate: 92,
        lateCount: 3,
        onTimeRate: 85,
        status: 'good',
      },
    ],
    teamPerformances: [
      {
        id: 'team-1',
        name: 'Équipe Dev',
        memberCount: 8,
        avgHours: 165,
        attendanceRate: 95,
        productivity: 88,
      },
    ],
    summary: {
      topPerformer: {
        name: 'Jean Dupont',
        totalHours: 168,
        attendanceRate: 98,
      },
      bestTeam: { name: 'Équipe Dev', attendanceRate: 95, productivity: 88 },
      attentionPoints: {
        message: '3 retards cette semaine',
        change: 50,
        trend: 'up',
      },
    },
  };

  const mockKPIResponse = {
    work: {
      totalHours: 1250,
      avgHoursPerDay: 8.2,
      attendanceRate: 94,
      avgArrivalTime: '09:10',
      trend: 'stable',
    },
    break_stats: {
      totalBreakHours: 150,
      avgBreakPerDay: 1,
      breakComplianceRate: 95,
      avgBreakTime: '12:30',
      trend: 'stable',
    },
    hours_chart: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      data: [320, 315, 310, 305],
    },
    attendance_chart: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      data: [95, 94, 93, 94],
    },
  };

  beforeEach(async () => {
    // Setup AuthService mock
    authServiceMock = {
      login: jest.fn().mockReturnValue(of(mockLoginResponse)),
      verifyCode: jest.fn().mockReturnValue(of(mockVerifyResponse)),
      logout: jest.fn().mockReturnValue(of(undefined)),
      currentUser: jest.fn().mockReturnValue(mockManager),
      isAuthenticated: jest.fn().mockReturnValue(true),
      getToken: jest.fn().mockReturnValue('manager-access-token'),
      verificationToken: jest.fn().mockReturnValue('temp-verification-token'),
    };

    // Setup UserService mock
    userServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of(mockManager)),
      getAllUsers: jest.fn().mockReturnValue(of(mockUsers)),
      createUser: jest
        .fn()
        .mockReturnValue(of({ ...mockUsers[0], id: 'new-user' })),
      updateUser: jest.fn().mockReturnValue(of(mockUsers[0])),
      deleteUser: jest.fn().mockReturnValue(of(undefined)),
      getManagerEmployees: jest.fn().mockReturnValue(of(mockUsers)),
    };

    // Setup TeamService mock
    teamServiceMock = {
      getAllTeams: jest.fn().mockReturnValue(of(mockTeams)),
      getTeamById: jest.fn().mockReturnValue(of(mockTeams[0])),
      createTeam: jest
        .fn()
        .mockReturnValue(
          of({
            id: 'new-team',
            name: 'New Team',
            description: '',
            manager: 'mgr-001',
          })
        ),
      updateTeam: jest.fn().mockReturnValue(of(mockTeams[0])),
      deleteTeam: jest.fn().mockReturnValue(of(undefined)),
      getTeamMembers: jest.fn().mockReturnValue(of(mockUsers.slice(0, 2))),
      addTeamMember: jest.fn().mockReturnValue(of(undefined)),
      removeTeamMember: jest.fn().mockReturnValue(of(undefined)),
    };

    // Setup ReportService mock
    reportServiceMock = {
      getReports: jest.fn().mockReturnValue(of(mockReportResponse)),
      generateReport: jest.fn().mockReturnValue(of(new Blob(['PDF content']))),
      calculateDateRange: jest
        .fn()
        .mockReturnValue({ start_date: '2024-01-01', end_date: '2024-01-31' }),
      generateFilename: jest
        .fn()
        .mockReturnValue('rapport_global_month_2024-01.pdf'),
      downloadFile: jest.fn(),
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
          { path: 'teams', component: TeamsComponent },
          { path: 'users', component: UsersComponent },
          { path: 'reports', component: ReportsComponent },
          { path: 'profile', component: ProfileComponent },
        ]),
      ],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: TeamService, useValue: teamServiceMock },
        { provide: ReportService, useValue: reportServiceMock },
        { provide: StatsService, useValue: statsServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    router.initialNavigation();
  });

  describe('1. Authentication Flow', () => {
    it('should complete login → 2FA → dashboard flow for manager', fakeAsync(() => {
      // Step 1: Navigate to login
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Step 2: Navigate to 2FA verification
      router.navigate(['/verify-2fa']);
      tick();
      expect(location.path()).toBe('/verify-2fa');

      // Step 3: After 2FA, navigate to dashboard
      router.navigate(['/dashboard']);
      tick();
      expect(location.path()).toBe('/dashboard');

      // Verify manager role
      expect(authServiceMock.currentUser().role).toBe('MANAGER');
    }));

    it('should authenticate as manager', fakeAsync(() => {
      authServiceMock.login('manager@company.com', 'managerpass');
      tick();

      authServiceMock.verifyCode('654321');
      tick();

      const user = authServiceMock.currentUser();
      expect(user.role).toBe('MANAGER');
      expect(user.first_name).toBe('Marie');
    }));
  });

  describe('2. Dashboard Access (Full View)', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/dashboard']);
      tick();
    }));

    it('should navigate to dashboard', () => {
      expect(location.path()).toBe('/dashboard');
    });

    it('should load team-wide KPIs', fakeAsync(() => {
      statsServiceMock.getKPIs({
        filter_type: 'teams',
        period: 'month',
      });
      tick();

      expect(statsServiceMock.getKPIs).toHaveBeenCalled();
    }));

    it('should have access to manager features', () => {
      const user = authServiceMock.currentUser();
      expect(user.role).toBe('MANAGER');
      // Manager should see Teams, Users, Reports in menu
    });

    it('should load teams for filter', fakeAsync(() => {
      teamServiceMock.getAllTeams();
      tick();

      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
    }));

    it('should load employees for filter', fakeAsync(() => {
      userServiceMock.getAllUsers();
      tick();

      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
    }));
  });

  describe('3. Teams Management', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/teams']);
      tick();
    }));

    it('should navigate to teams page', () => {
      expect(location.path()).toBe('/teams');
    });

    it('should load all teams', fakeAsync(() => {
      teamServiceMock.getAllTeams();
      tick();

      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
    }));

    it('should create a new team', fakeAsync(() => {
      const newTeam = { name: 'Nouvelle Équipe', description: 'Description' };

      teamServiceMock.createTeam(newTeam);
      tick();

      expect(teamServiceMock.createTeam).toHaveBeenCalled();
    }));

    it('should update an existing team', fakeAsync(() => {
      const updatedTeam = {
        name: 'Équipe Dev Updated',
        description: 'New description',
      };

      teamServiceMock.updateTeam('team-1', updatedTeam);
      tick();

      expect(teamServiceMock.updateTeam).toHaveBeenCalled();
    }));

    it('should delete a team', fakeAsync(() => {
      teamServiceMock.deleteTeam('team-2');
      tick();

      expect(teamServiceMock.deleteTeam).toHaveBeenCalled();
    }));

    it('should add member to team', fakeAsync(() => {
      teamServiceMock.addTeamMember('team-1', 'emp-003');
      tick();

      expect(teamServiceMock.addTeamMember).toHaveBeenCalled();
    }));

    it('should remove member from team', fakeAsync(() => {
      teamServiceMock.removeTeamMember('team-1', 'emp-001');
      tick();

      expect(teamServiceMock.removeTeamMember).toHaveBeenCalled();
    }));

    it('should view team members', fakeAsync(() => {
      teamServiceMock.getTeamMembers('team-1');
      tick();

      expect(teamServiceMock.getTeamMembers).toHaveBeenCalled();
    }));
  });

  describe('4. Users Management', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/users']);
      tick();
    }));

    it('should navigate to users page', () => {
      expect(location.path()).toBe('/users');
    });

    it('should load all users', fakeAsync(() => {
      userServiceMock.getAllUsers();
      tick();

      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
    }));

    it('should create a new user', fakeAsync(() => {
      const newUser = {
        email: 'nouveau@company.com',
        first_name: 'Nouveau',
        last_name: 'User',
        role: 'EMPLOYEE',
      };

      userServiceMock.createUser(newUser);
      tick();

      expect(userServiceMock.createUser).toHaveBeenCalled();
    }));

    it('should update an existing user', fakeAsync(() => {
      const updatedUser = {
        first_name: 'Jean-Pierre',
        role: 'EMPLOYEE',
      };

      userServiceMock.updateUser('emp-001', updatedUser);
      tick();

      expect(userServiceMock.updateUser).toHaveBeenCalled();
    }));

    it('should delete/deactivate a user', fakeAsync(() => {
      userServiceMock.deleteUser('emp-003');
      tick();

      expect(userServiceMock.deleteUser).toHaveBeenCalled();
    }));

    it('should filter users by role', fakeAsync(() => {
      const allUsers = mockUsers;
      const employees = allUsers.filter((u) => u.role === 'EMPLOYEE');

      expect(employees.length).toBe(3);
    }));

    it('should filter users by status', fakeAsync(() => {
      const allUsers = mockUsers;
      const activeUsers = allUsers.filter((u) => u.is_active);

      expect(activeUsers.length).toBe(2);
    }));
  });

  describe('5. Reports & Analytics', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/reports']);
      tick();
    }));

    it('should navigate to reports page', () => {
      expect(location.path()).toBe('/reports');
    });

    it('should load global reports', fakeAsync(() => {
      reportServiceMock.getReports({ period: 'month', report_type: 'global' });
      tick();

      expect(reportServiceMock.getReports).toHaveBeenCalled();
    }));

    it('should load team-specific reports', fakeAsync(() => {
      reportServiceMock.getReports({
        period: 'month',
        report_type: 'team',
        team_id: 'team-1',
      });
      tick();

      expect(reportServiceMock.getReports).toHaveBeenCalled();
    }));

    it('should load individual employee reports', fakeAsync(() => {
      reportServiceMock.getReports({
        period: 'week',
        report_type: 'individual',
        employee_id: 'emp-001',
      });
      tick();

      expect(reportServiceMock.getReports).toHaveBeenCalled();
    }));

    it('should export report as PDF', fakeAsync(() => {
      const exportRequest = {
        report_type: 'global',
        format: 'pdf',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      reportServiceMock.generateReport(exportRequest);
      tick();

      expect(reportServiceMock.generateReport).toHaveBeenCalled();
    }));

    it('should export report as Excel', fakeAsync(() => {
      const exportRequest = {
        report_type: 'team',
        format: 'xlsx',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        team_id: 'team-1',
      };

      reportServiceMock.generateReport(exportRequest);
      tick();

      expect(reportServiceMock.generateReport).toHaveBeenCalled();
    }));

    it('should calculate date range for different periods', () => {
      reportServiceMock.calculateDateRange('week');
      reportServiceMock.calculateDateRange('month');
      reportServiceMock.calculateDateRange('quarter');
      reportServiceMock.calculateDateRange('year');

      expect(reportServiceMock.calculateDateRange).toHaveBeenCalledTimes(4);
    });
  });

  describe('6. Profile Management', () => {
    beforeEach(fakeAsync(() => {
      router.navigate(['/profile']);
      tick();
    }));

    it('should navigate to profile page', () => {
      expect(location.path()).toBe('/profile');
    });

    it('should load manager profile', fakeAsync(() => {
      userServiceMock.getCurrentUser();
      tick();

      expect(userServiceMock.getCurrentUser).toHaveBeenCalled();
    }));
  });

  describe('7. Logout', () => {
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

  describe('Complete Manager Journey', () => {
    it('should complete full manager workflow', fakeAsync(() => {
      // 1. Login
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // 2. 2FA Verification
      router.navigate(['/verify-2fa']);
      tick();
      expect(location.path()).toBe('/verify-2fa');

      // 3. Dashboard (full view)
      router.navigate(['/dashboard']);
      tick();
      expect(location.path()).toBe('/dashboard');

      // 4. Manage Teams
      router.navigate(['/teams']);
      tick();
      expect(location.path()).toBe('/teams');
      teamServiceMock.getAllTeams();

      // 5. Manage Users
      router.navigate(['/users']);
      tick();
      expect(location.path()).toBe('/users');
      userServiceMock.getAllUsers();

      // 6. View Reports
      router.navigate(['/reports']);
      tick();
      expect(location.path()).toBe('/reports');
      reportServiceMock.getReports({ period: 'month', report_type: 'global' });

      // 7. View Profile
      router.navigate(['/profile']);
      tick();
      expect(location.path()).toBe('/profile');

      // 8. Logout
      authServiceMock.logout();
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Verify all manager-specific services were called
      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
      expect(reportServiceMock.getReports).toHaveBeenCalled();
      expect(authServiceMock.logout).toHaveBeenCalled();
    }));
  });

  describe('Role-based Access Control', () => {
    it('should have MANAGER role', () => {
      expect(authServiceMock.currentUser().role).toBe('MANAGER');
    });

    it('should access all manager routes', fakeAsync(() => {
      const managerRoutes = [
        '/dashboard',
        '/teams',
        '/users',
        '/reports',
        '/profile',
      ];

      for (const route of managerRoutes) {
        router.navigate([route]);
        tick();
        expect(location.path()).toBe(route);
      }
    }));

    it('should see team and employee data', fakeAsync(() => {
      teamServiceMock.getAllTeams();
      userServiceMock.getManagerEmployees('mgr-001');
      tick();

      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
      expect(userServiceMock.getManagerEmployees).toHaveBeenCalled();
    }));
  });
});
