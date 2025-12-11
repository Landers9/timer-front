// cypress/support/commands.ts

// ============================================
// AUTHENTICATION BYPASS COMMANDS (pour E2E)
// ============================================

/**
 * Bypass l'authentification et accède directement aux pages protégées
 * Injecte tous les tokens nécessaires dans localStorage
 */
Cypress.Commands.add('bypassAuthAsEmployee', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', 'employee-access-token');
    win.localStorage.setItem('refresh_token', 'employee-refresh-token');
    win.localStorage.setItem('access_expires', String(Date.now() + 3600000));
    win.localStorage.setItem('refresh_expires', String(Date.now() + 86400000));
    win.localStorage.setItem(
      'current_user',
      JSON.stringify({
        id: 'emp-001',
        email: 'employee@company.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'EMPLOYEE',
        phone_number: '0612345678',
      })
    );
  });
});

Cypress.Commands.add('bypassAuthAsManager', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', 'manager-access-token');
    win.localStorage.setItem('refresh_token', 'manager-refresh-token');
    win.localStorage.setItem('access_expires', String(Date.now() + 3600000));
    win.localStorage.setItem('refresh_expires', String(Date.now() + 86400000));
    win.localStorage.setItem(
      'current_user',
      JSON.stringify({
        id: 'mgr-001',
        email: 'manager@company.com',
        first_name: 'Marie',
        last_name: 'Martin',
        role: 'MANAGER',
        phone_number: '0687654321',
      })
    );
  });
});

// ============================================
// LOGIN FLOW COMMANDS
// ============================================

Cypress.Commands.add('loginAsEmployee', () => {
  cy.window().then((win) => {
    win.localStorage.setItem(
      'verification_token',
      'employee-verification-token'
    );
  });

  cy.visit('/login');
  cy.get('input[name="email"]').type('employee@company.com');
  cy.get('input[name="password"]').type('Employee123!');
  cy.get('button[type="submit"]').click();

  cy.url().should('include', '/verify-2fa');
});

Cypress.Commands.add('loginAsManager', () => {
  cy.window().then((win) => {
    win.localStorage.setItem(
      'verification_token',
      'manager-verification-token'
    );
  });

  cy.visit('/login');
  cy.get('input[name="email"]').type('manager@company.com');
  cy.get('input[name="password"]').type('Manager123!');
  cy.get('button[type="submit"]').click();

  cy.url().should('include', '/verify-2fa');
});

Cypress.Commands.add('complete2FA', (code: string) => {
  cy.get('input[name="otpCode"]').clear().type(code);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('logout', () => {
  cy.contains('Logout').click();
  cy.url().should('include', '/login');
});

// ============================================
// API MOCKING COMMANDS
// ============================================

Cypress.Commands.add('mockAPI', () => {
  // IMPORTANT: Mock token refresh to prevent logout
  cy.intercept('POST', '**/auth/token/refresh/', {
    statusCode: 200,
    body: {
      access: 'new-access-token',
      access_expires: 3600,
    },
  }).as('tokenRefresh');

  // Mock Login
  cy.intercept('POST', '**/auth/login/', {
    statusCode: 200,
    body: {
      requires_verification: true,
      message: 'Code envoyé',
      token: 'temp-token-123',
    },
  }).as('login');

  // Mock 2FA Verification - retourne tokens complets
  cy.intercept('POST', '**/auth/login/verify-code/', {
    statusCode: 200,
    body: {
      user: {
        id: 'user-001',
        email: 'test@company.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'EMPLOYEE',
      },
      access: 'access-token-123',
      refresh: 'refresh-token-456',
      access_expires: 3600,
      refresh_expires: 86400,
      message: 'Success',
    },
  }).as('verify2FA');

  // Mock Current User
  cy.intercept('GET', '**/users/me/', {
    statusCode: 200,
    body: {
      id: 'user-001',
      email: 'test@company.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'EMPLOYEE',
      phone_number: '0612345678',
      created_at: '2024-01-01T00:00:00Z',
    },
  }).as('getCurrentUser');

  // Mock KPIs
  cy.intercept('GET', '**/stats/kpis*', {
    statusCode: 200,
    body: {
      work: {
        totalHours: 160,
        avgHoursPerDay: 8,
        attendanceRate: 95,
        avgArrivalTime: '09:00',
        trend: 'up',
      },
      break_stats: {
        totalBreakHours: 20,
        avgBreakPerDay: 1,
        breakComplianceRate: 100,
        avgBreakTime: '12:30',
        trend: 'stable',
      },
      hours_chart: { labels: ['Lun', 'Mar', 'Mer'], data: [8, 8, 8] },
      attendance_chart: {
        labels: ['Lun', 'Mar', 'Mer'],
        data: [100, 100, 100],
      },
    },
  }).as('getKPIs');

  // Mock Clock Records - pattern: /users/{userId}/clocks/
  // Use regex for more reliable matching
  cy.intercept(
    { method: 'GET', url: /\/users\/[^/]+\/clocks\/?$/ },
    {
      statusCode: 200,
      body: [
        {
          id: 'clock-1',
          clock_in_time: '2024-01-15T09:00:00Z',
          clock_out_time: '2024-01-15T18:00:00Z',
          break_in_time: '2024-01-15T12:00:00Z',
          break_out_time: '2024-01-15T13:00:00Z',
        },
      ],
    }
  ).as('getClocks');

  // Mock Clock Current Status - pattern: /users/clocks/current/
  cy.intercept(
    { method: 'GET', url: /\/users\/clocks\/current/ },
    {
      statusCode: 200,
      body: { status: 'no_session' },
    }
  ).as('getClockStatus');

  // Mock Clock Actions
  cy.intercept(
    { method: 'POST', url: /\/users\/[^/]+\/clocks/ },
    {
      statusCode: 201,
      body: { id: 'new-clock', status: 'clocked_in' },
    }
  ).as('clockAction');

  // Mock Teams
  cy.intercept('GET', '**/teams/', {
    statusCode: 200,
    body: [
      {
        id: 'team-1',
        name: 'Dev Team',
        description: 'Development',
        manager: 'mgr-001',
        member_count: 5,
      },
      {
        id: 'team-2',
        name: 'QA Team',
        description: 'Quality',
        manager: 'mgr-001',
        member_count: 3,
      },
    ],
  }).as('getTeams');

  // Mock Team members
  cy.intercept('GET', '**/teams/*/members/', {
    statusCode: 200,
    body: [
      {
        id: 'emp-001',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@company.com',
      },
    ],
  }).as('getTeamMembers');

  // Mock Users list
  cy.intercept('GET', '**/users/', {
    statusCode: 200,
    body: [
      {
        id: 'user-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@company.com',
        role: 'EMPLOYEE',
        is_active: true,
      },
      {
        id: 'user-2',
        first_name: 'Paul',
        last_name: 'Martin',
        email: 'paul@company.com',
        role: 'EMPLOYEE',
        is_active: true,
      },
    ],
  }).as('getUsers');

  // Mock Employees list (used by TeamsComponent)
  cy.intercept('GET', '**/users/employees/', {
    statusCode: 200,
    body: [
      {
        id: 'emp-001',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@company.com',
        role: 'EMPLOYEE',
        is_active: true,
      },
      {
        id: 'emp-002',
        first_name: 'Paul',
        last_name: 'Martin',
        email: 'paul@company.com',
        role: 'EMPLOYEE',
        is_active: true,
      },
    ],
  }).as('getEmployees');

  // Mock Reports
  cy.intercept('GET', '**/reports/*', {
    statusCode: 200,
    body: {
      kpis: [
        {
          title: 'Heures totales',
          value: '160h',
          change: 5,
          trend: 'up',
          color: 'primary',
        },
      ],
      employeePerformances: [],
      teamPerformances: [],
      summary: {
        topPerformer: {
          name: 'Jean Dupont',
          totalHours: 168,
          attendanceRate: 98,
        },
        bestTeam: { name: 'Dev Team', attendanceRate: 95, productivity: 88 },
        attentionPoints: { message: 'Aucun', change: 0, trend: 'stable' },
      },
    },
  }).as('getReports');

  // Mock Logout
  cy.intercept('POST', '**/auth/logout/', {
    statusCode: 200,
    body: {},
  }).as('logout');
});
