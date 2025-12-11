// cypress.d.ts
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Bypass auth and inject employee tokens directly into localStorage
     * @example cy.bypassAuthAsEmployee()
     */
    bypassAuthAsEmployee(): Chainable<void>;

    /**
     * Bypass auth and inject manager tokens directly into localStorage
     * @example cy.bypassAuthAsManager()
     */
    bypassAuthAsManager(): Chainable<void>;

    /**
     * Login as employee (navigates to login, fills form, redirects to 2FA)
     * @example cy.loginAsEmployee()
     */
    loginAsEmployee(): Chainable<void>;

    /**
     * Login as manager (navigates to login, fills form, redirects to 2FA)
     * @example cy.loginAsManager()
     */
    loginAsManager(): Chainable<void>;

    /**
     * Complete 2FA verification with given code
     * @example cy.complete2FA('123456')
     */
    complete2FA(code: string): Chainable<void>;

    /**
     * Logout and redirect to login page
     * @example cy.logout()
     */
    logout(): Chainable<void>;

    /**
     * Setup all API mocks (login, 2FA, users, teams, etc.)
     * @example cy.mockAPI()
     */
    mockAPI(): Chainable<void>;
  }
}
