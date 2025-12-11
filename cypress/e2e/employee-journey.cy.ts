// cypress/e2e/employee-journey.cy.ts

/**
 * Tests E2E - Parcours EMPLOYEE
 *
 * Utilise bypassAuth pour injecter directement les tokens
 * et éviter les problèmes de synchronisation avec Angular
 */

describe('Employee Journey E2E', () => {
  beforeEach(() => {
    // Setup API mocks
    cy.mockAPI();

    // Override avec données Employee spécifiques
    cy.intercept('GET', '**/users/me/', {
      statusCode: 200,
      body: {
        id: 'emp-001',
        email: 'employee@company.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'EMPLOYEE',
        phone_number: '0612345678',
        created_at: '2024-01-01T00:00:00Z',
        department: 'IT',
        position: 'Developer',
      },
    }).as('getEmployeeProfile');
  });

  // ============================================
  // 1. AUTHENTICATION TESTS
  // ============================================
  describe('1. Authentication', () => {
    it('should display login page', () => {
      cy.visit('/login');

      cy.get('h2').should('contain', 'Connexion');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show error with invalid credentials', () => {
      cy.intercept('POST', '**/auth/login/', {
        statusCode: 401,
        body: { message: 'Email ou mot de passe incorrect' },
      }).as('loginError');

      cy.visit('/login');
      cy.get('input[name="email"]').type('wrong@email.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginError');
      cy.contains('Email ou mot de passe incorrect').should('be.visible');
    });

    it('should redirect to 2FA after valid login', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('employee@company.com');
      cy.get('input[name="password"]').type('Employee123!');
      cy.get('button[type="submit"]').click();

      cy.wait('@login');
      cy.url().should('include', '/verify-2fa');
    });
  });

  // ============================================
  // 2. DASHBOARD TESTS (avec bypassAuth)
  // ============================================
  describe('2. Dashboard (Limited View)', () => {
    beforeEach(() => {
      // Bypass auth et accéder directement au dashboard
      cy.bypassAuthAsEmployee();
      cy.visit('/dashboard');
    });

    it('should display dashboard', () => {
      cy.url().should('include', '/dashboard');
    });

    it('should load KPIs', () => {
      cy.wait('@getKPIs');
    });

    it('should show employee name in header', () => {
      cy.wait('@getEmployeeProfile');
      cy.contains('Jean').should('be.visible');
    });

    it('should NOT show manager-only menu items', () => {
      // Employee should NOT see Teams, Users, Reports in sidebar
      cy.get('aside').should('not.contain', 'Teams');
      cy.get('aside').should('not.contain', 'Users');
      cy.get('aside').should('not.contain', 'Reports');
    });

    it('should show employee menu items', () => {
      cy.get('aside').contains('Dashboard').should('be.visible');
      cy.get('aside').contains('Clock').should('be.visible');
      cy.get('aside').contains('Profile').should('be.visible');
    });
  });

  // ============================================
  // 3. CLOCK HISTORY TESTS
  // ============================================
  describe('3. Clock History', () => {
    beforeEach(() => {
      // Mock with regex for reliable matching
      cy.intercept(
        { method: 'GET', url: /\/users\/[^/]+\/clocks\/?$/ },
        {
          statusCode: 200,
          body: [
            {
              id: 'clock-1',
              clock_in_time: '2024-01-15T09:00:00Z',
              clock_out_time: '2024-01-15T18:00:00Z',
            },
          ],
        }
      ).as('getUserClocks');

      cy.bypassAuthAsEmployee();
      cy.visit('/clock');
    });

    it('should display clock history page', () => {
      cy.url().should('include', '/clock');
    });

    it('should load clock records', () => {
      cy.wait('@getUserClocks');
    });

    it('should have button to go to clock action', () => {
      cy.contains('Pointer').should('be.visible');
    });
  });

  // ============================================
  // 4. CLOCK ACTION TESTS
  // ============================================
  describe('4. Clock Action (Pointage)', () => {
    beforeEach(() => {
      // Mock with regex for reliable matching
      cy.intercept(
        { method: 'GET', url: /\/users\/clocks\/current/ },
        {
          statusCode: 200,
          body: { status: 'no_session' },
        }
      ).as('getClockStatus');

      cy.intercept(
        { method: 'POST', url: /\/users\/[^/]+\/clocks/ },
        {
          statusCode: 201,
          body: {
            id: 'new-clock',
            status: 'clocked_in',
            clock_in_time: new Date().toISOString(),
          },
        }
      ).as('clockAction');

      cy.bypassAuthAsEmployee();
      cy.visit('/clock-action');
    });

    it('should display clock action page', () => {
      cy.url().should('include', '/clock-action');
    });

    it('should show work controls', () => {
      // The button text is dynamic based on state
      // Look for "Working hours" label which is always visible
      cy.contains('Working hours').should('be.visible');
    });
  });

  // ============================================
  // 5. PROFILE TESTS
  // ============================================
  describe('5. Profile', () => {
    beforeEach(() => {
      cy.bypassAuthAsEmployee();
      cy.visit('/profile');
    });

    it('should display profile page', () => {
      cy.url().should('include', '/profile');
    });

    it('should load user profile', () => {
      cy.wait('@getEmployeeProfile');
      cy.contains('Jean').should('be.visible');
      cy.contains('employee@company.com').should('be.visible');
    });

    it('should have edit button', () => {
      cy.wait('@getEmployeeProfile');
      cy.contains('Modifier').should('be.visible');
    });

    it('should have change password button', () => {
      cy.wait('@getEmployeeProfile');
      cy.contains('mot de passe').should('be.visible');
    });
  });

  // ============================================
  // 6. LOGOUT TESTS
  // ============================================
  describe('6. Logout', () => {
    beforeEach(() => {
      cy.bypassAuthAsEmployee();
      cy.visit('/dashboard');
    });

    it('should logout and redirect to login', () => {
      cy.contains('Logout').click();
      cy.wait('@logout');
      cy.url().should('include', '/login');
    });
  });

  // ============================================
  // 7. NAVIGATION TESTS
  // ============================================
  describe('7. Navigation', () => {
    beforeEach(() => {
      cy.bypassAuthAsEmployee();
    });

    it('should navigate between pages', () => {
      // Dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');

      // Clock
      cy.get('aside').contains('Clock').click();
      cy.url().should('include', '/clock');

      // Profile
      cy.get('aside').contains('Profile').click();
      cy.url().should('include', '/profile');

      // Back to Dashboard
      cy.get('aside').contains('Dashboard').click();
      cy.url().should('include', '/dashboard');
    });
  });

  // ============================================
  // 8. PROTECTED ROUTES
  // ============================================
  describe('8. Protected Routes', () => {
    it('should redirect to login when not authenticated', () => {
      // Clear localStorage
      cy.clearLocalStorage();

      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing clock', () => {
      cy.clearLocalStorage();

      cy.visit('/clock');
      cy.url().should('include', '/login');
    });
  });
});
