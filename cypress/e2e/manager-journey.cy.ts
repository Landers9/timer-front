// cypress/e2e/manager-journey.cy.ts

/**
 * Tests E2E - Parcours MANAGER
 *
 * Stratégie : Définir TOUS les mocks avant chaque navigation
 */

// Helper function pour setup tous les mocks manager
const setupManagerMocks = () => {
  // CRITICAL: Token refresh - évite la boucle de logout
  cy.intercept('POST', '**/auth/token/refresh/**', {
    statusCode: 200,
    body: {
      access: 'new-access-token-123',
      access_expires: 3600,
    },
  }).as('tokenRefresh');

  // Auth endpoints
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

  // Current User - Manager
  cy.intercept('GET', '**/users/me/', {
    statusCode: 200,
    body: {
      id: 'mgr-001',
      email: 'manager@company.com',
      first_name: 'Marie',
      last_name: 'Martin',
      role: 'MANAGER',
      phone_number: '0687654321',
    },
  }).as('getManagerProfile');

  // Employees endpoint (CRITICAL - appelé par TeamsComponent)
  cy.intercept('GET', '**/users/employees/**', {
    statusCode: 200,
    body: [
      {
        id: 'emp-001',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@company.com',
        role: 'EMPLOYEE',
      },
      {
        id: 'emp-002',
        first_name: 'Paul',
        last_name: 'Martin',
        email: 'paul@company.com',
        role: 'EMPLOYEE',
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
  cy.intercept('GET', '**/teams/*/members/**', {
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
  cy.intercept('GET', '**/stats/kpis**', {
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
      },
    },
  }).as('getReports');

  // Clocks
  cy.intercept('GET', '**/clocks/**', {
    statusCode: 200,
    body: [],
  }).as('getClocks');
};

// Helper pour login manager
const loginAsManager = () => {
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
      })
    );
  });
};

describe('Manager Journey E2E', () => {
  // ============================================
  // 1. AUTHENTICATION
  // ============================================
  describe('1. Authentication', () => {
    it('should display login page', () => {
      setupManagerMocks();
      cy.visit('/login');
      cy.get('h2').should('contain', 'Connexion');
    });

    it('should redirect to 2FA after login', () => {
      setupManagerMocks();
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
      setupManagerMocks();
      loginAsManager();
      cy.visit('/dashboard');
      // Attendre le chargement
      cy.wait('@getManagerProfile');
    });

    it('should display dashboard page', () => {
      cy.url().should('include', '/dashboard');
    });

    it('should show manager name in UI', () => {
      cy.contains('Marie').should('be.visible');
    });

    it('should display Teams link in sidebar (manager only)', () => {
      cy.get('aside').contains('Teams').should('be.visible');
    });

    it('should display Users link in sidebar (manager only)', () => {
      cy.get('aside').contains('Users').should('be.visible');
    });

    it('should display Reports link in sidebar (manager only)', () => {
      cy.get('aside').contains('Reports').should('be.visible');
    });
  });

  // ============================================
  // 3. TEAMS PAGE
  // ============================================
  describe('3. Teams Page', () => {
    beforeEach(() => {
      setupManagerMocks();
      loginAsManager();
      cy.visit('/teams');
      // Attendre le chargement des données
      cy.wait('@getTeams');
      cy.wait('@getEmployees');
    });

    it('should display teams page', () => {
      cy.url().should('include', '/teams');
    });

    it('should display page title', () => {
      cy.contains('Gestion des équipes').should('be.visible');
    });

    it('should display create team button', () => {
      cy.contains('Créer une équipe').should('be.visible');
    });

    it('should open create modal when clicking create button', () => {
      cy.contains('Créer une équipe').click();
      cy.get('input[name="name"]').should('be.visible');
    });
  });

  // ============================================
  // 4. USERS PAGE
  // ============================================
  describe('4. Users Page', () => {
    beforeEach(() => {
      setupManagerMocks();
      loginAsManager();
      cy.visit('/users');
      // Attendre le chargement
      cy.wait('@getUsers');
    });

    it('should display users page', () => {
      cy.url().should('include', '/users');
    });

    it('should display page title', () => {
      cy.contains('Gestion des utilisateurs').should('be.visible');
    });

    it('should display add user button', () => {
      cy.contains('Ajouter un utilisateur').should('be.visible');
    });
  });

  // ============================================
  // 5. REPORTS PAGE
  // ============================================
  describe('5. Reports Page', () => {
    beforeEach(() => {
      setupManagerMocks();
      loginAsManager();
      cy.visit('/reports');
      // Attendre le chargement
      cy.wait('@getReports');
    });

    it('should display reports page', () => {
      cy.url().should('include', '/reports');
    });

    it('should display page title', () => {
      cy.contains('Rapports & KPIs').should('be.visible');
    });

    it('should have export button', () => {
      cy.contains('Exporter le rapport').should('be.visible');
    });
  });

  // ============================================
  // 6. PROFILE PAGE
  // ============================================
  describe('6. Profile Page', () => {
    beforeEach(() => {
      setupManagerMocks();
      loginAsManager();
      cy.visit('/profile');
      // Attendre que le profil soit chargé
      cy.wait('@getManagerProfile');
    });

    it('should display profile page', () => {
      cy.url().should('include', '/profile');
    });

    it('should show manager name', () => {
      cy.contains('Marie').should('be.visible');
    });

    it('should show Informations personnelles section', () => {
      cy.contains('Informations personnelles').should('be.visible');
    });
  });

  // ============================================
  // 7. NAVIGATION
  // ============================================
  describe('7. Navigation', () => {
    beforeEach(() => {
      setupManagerMocks();
      loginAsManager();
    });

    it('should navigate from dashboard to teams', () => {
      cy.visit('/dashboard');
      cy.wait('@getManagerProfile');
      cy.get('aside').contains('Teams').click();
      cy.url().should('include', '/teams');
    });

    it('should navigate from dashboard to users', () => {
      cy.visit('/dashboard');
      cy.wait('@getManagerProfile');
      cy.get('aside').contains('Users').click();
      cy.url().should('include', '/users');
    });

    it('should navigate from dashboard to reports', () => {
      cy.visit('/dashboard');
      cy.wait('@getManagerProfile');
      cy.get('aside').contains('Reports').click();
      cy.url().should('include', '/reports');
    });

    it('should navigate from dashboard to profile', () => {
      cy.visit('/dashboard');
      cy.wait('@getManagerProfile');
      cy.get('aside').contains('Profile').click();
      cy.url().should('include', '/profile');
    });
  });

  // ============================================
  // 8. LOGOUT
  // ============================================
  describe('8. Logout', () => {
    it('should logout and redirect to login', () => {
      setupManagerMocks();
      loginAsManager();
      cy.visit('/dashboard');
      cy.wait('@getManagerProfile');
      cy.contains('Logout').click();
      cy.url().should('include', '/login');
    });
  });

  // ============================================
  // 9. PROTECTED ROUTES
  // ============================================
  describe('9. Protected Routes', () => {
    beforeEach(() => {
      setupManagerMocks();
    });

    it('should redirect unauthenticated user from teams to login', () => {
      cy.clearLocalStorage();
      cy.visit('/teams');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated user from users to login', () => {
      cy.clearLocalStorage();
      cy.visit('/users');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated user from reports to login', () => {
      cy.clearLocalStorage();
      cy.visit('/reports');
      cy.url().should('include', '/login');
    });
  });
});
