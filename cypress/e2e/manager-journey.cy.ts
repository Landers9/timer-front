// cypress/e2e/manager-journey.cy.ts

/**
 * Tests E2E - Parcours MANAGER
 *
 * Utilise bypassAuth + mocks complets pour tous les endpoints
 */

describe('Manager Journey E2E', () => {
  beforeEach(() => {
    // ============================================
    // SETUP ALL API MOCKS
    // ============================================

    // Auth
    cy.intercept('POST', '**/auth/token/refresh/', {
      statusCode: 200,
      body: { access: 'new-access-token', access_expires: 3600 },
    }).as('tokenRefresh');

    cy.intercept('POST', '**/auth/login/', {
      statusCode: 200,
      body: {
        requires_verification: true,
        message: 'Code envoyé',
        token: 'temp-token',
      },
    }).as('login');

    cy.intercept('POST', '**/auth/logout/', {
      statusCode: 200,
      body: {},
    }).as('logout');

    // Current User (Manager)
    cy.intercept('GET', '**/users/me/', {
      statusCode: 200,
      body: {
        id: 'mgr-001',
        email: 'manager@company.com',
        first_name: 'Marie',
        last_name: 'Martin',
        role: 'MANAGER',
        phone_number: '0687654321',
        created_at: '2023-06-01T00:00:00Z',
      },
    }).as('getManagerProfile');

    // IMPORTANT: Mock /users/employees/ - endpoint appelé par TeamsComponent
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
        {
          id: 'emp-003',
          first_name: 'Sophie',
          last_name: 'Durand',
          email: 'sophie@company.com',
          role: 'EMPLOYEE',
          is_active: true,
        },
      ],
    }).as('getEmployees');

    // Users list
    cy.intercept('GET', '**/users/', {
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
    }).as('getUsers');

    // Teams
    cy.intercept('GET', '**/teams/', {
      statusCode: 200,
      body: [
        {
          id: 'team-1',
          name: 'Dev Team',
          description: 'Development team',
          manager: 'mgr-001',
          member_count: 5,
        },
        {
          id: 'team-2',
          name: 'QA Team',
          description: 'Quality Assurance',
          manager: 'mgr-001',
          member_count: 3,
        },
      ],
    }).as('getTeams');

    cy.intercept('POST', '**/teams/', {
      statusCode: 201,
      body: {
        id: 'new-team',
        name: 'New Team',
        description: 'Description',
        manager: 'mgr-001',
      },
    }).as('createTeam');

    cy.intercept('PUT', '**/teams/**', {
      statusCode: 200,
      body: {
        id: 'team-1',
        name: 'Updated Team',
        description: 'Updated',
        manager: 'mgr-001',
      },
    }).as('updateTeam');

    cy.intercept('DELETE', '**/teams/**', {
      statusCode: 204,
      body: {},
    }).as('deleteTeam');

    // Team members
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

    // KPIs
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

    // Reports
    cy.intercept('GET', '**/reports/**', {
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

    // Clocks
    cy.intercept(
      { method: 'GET', url: /\/users\/[^/]+\/clocks/ },
      {
        statusCode: 200,
        body: [],
      }
    ).as('getClocks');
  });

  // ============================================
  // 1. AUTHENTICATION
  // ============================================
  describe('1. Authentication', () => {
    it('should display login page', () => {
      cy.visit('/login');
      cy.get('h2').should('contain', 'Connexion');
    });

    it('should redirect to 2FA after login', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('manager@company.com');
      cy.get('input[name="password"]').type('Manager123!');
      cy.get('button[type="submit"]').click();
      cy.wait('@login');
      cy.url().should('include', '/verify-2fa');
    });
  });

  // ============================================
  // 2. DASHBOARD
  // ============================================
  describe('2. Dashboard', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
      cy.visit('/dashboard');
    });

    it('should display dashboard', () => {
      cy.url().should('include', '/dashboard');
    });

    it('should show manager name', () => {
      cy.wait('@getManagerProfile');
      cy.contains('Marie').should('be.visible');
    });

    it('should show all menu items for manager', () => {
      cy.get('aside').contains('Dashboard').should('be.visible');
      cy.get('aside').contains('Teams').should('be.visible');
      cy.get('aside').contains('Users').should('be.visible');
      cy.get('aside').contains('Reports').should('be.visible');
    });
  });

  // ============================================
  // 3. TEAMS
  // ============================================
  describe('3. Teams', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
      cy.visit('/teams');
    });

    it('should display teams page', () => {
      cy.url().should('include', '/teams');
      cy.wait('@getTeams');
    });

    it('should show teams list', () => {
      cy.wait('@getTeams');
      // Wait for page to fully load
      cy.get('table').should('be.visible');
    });

    it('should have create button', () => {
      // Le bouton avec l'icône Users et texte "Créer"
      cy.contains('Créer').should('be.visible');
    });

    it('should open create modal', () => {
      cy.contains('Créer').click();
      cy.get('input[name="name"]').should('be.visible');
      cy.contains('Créer une équipe').should('be.visible');
    });
  });

  // ============================================
  // 4. USERS
  // ============================================
  describe('4. Users', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
      cy.visit('/users');
    });

    it('should display users page', () => {
      cy.url().should('include', '/users');
      cy.wait('@getUsers');
    });

    it('should show users list', () => {
      cy.wait('@getUsers');
      cy.get('table').should('be.visible');
    });

    it('should have search input', () => {
      cy.get('input[placeholder*="Rechercher"]').should('be.visible');
    });
  });

  // ============================================
  // 5. REPORTS
  // ============================================
  describe('5. Reports', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
      cy.visit('/reports');
    });

    it('should display reports page', () => {
      cy.url().should('include', '/reports');
    });

    it('should load reports data', () => {
      cy.wait('@getReports');
    });

    it('should have export button', () => {
      cy.contains('Exporter').should('be.visible');
    });
  });

  // ============================================
  // 6. PROFILE
  // ============================================
  describe('6. Profile', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
      cy.visit('/profile');
    });

    it('should display profile page', () => {
      cy.url().should('include', '/profile');
    });

    it('should show manager info', () => {
      cy.wait('@getManagerProfile');
      cy.contains('Marie').should('be.visible');
      cy.contains('manager@company.com').should('be.visible');
    });
  });

  // ============================================
  // 7. NAVIGATION
  // ============================================
  describe('7. Navigation', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
    });

    it('should navigate to all manager pages', () => {
      // Dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');

      // Teams
      cy.get('aside').contains('Teams').click();
      cy.url().should('include', '/teams');

      // Users
      cy.get('aside').contains('Users').click();
      cy.url().should('include', '/users');

      // Reports
      cy.get('aside').contains('Reports').click();
      cy.url().should('include', '/reports');

      // Profile
      cy.get('aside').contains('Profile').click();
      cy.url().should('include', '/profile');
    });
  });

  // ============================================
  // 8. LOGOUT
  // ============================================
  describe('8. Logout', () => {
    beforeEach(() => {
      cy.bypassAuthAsManager();
      cy.visit('/dashboard');
    });

    it('should logout', () => {
      cy.contains('Logout').click();
      cy.wait('@logout');
      cy.url().should('include', '/login');
    });
  });

  // ============================================
  // 9. PROTECTED ROUTES
  // ============================================
  describe('9. Protected Routes', () => {
    it('should redirect to login when not authenticated', () => {
      cy.clearLocalStorage();
      cy.visit('/teams');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing users', () => {
      cy.clearLocalStorage();
      cy.visit('/users');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing reports', () => {
      cy.clearLocalStorage();
      cy.visit('/reports');
      cy.url().should('include', '/login');
    });
  });
});
