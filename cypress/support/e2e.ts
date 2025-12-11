// cypress/support/e2e.ts

// Import commands
import './commands';

// Declare global types for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Bypass auth and inject employee tokens directly
       */
      bypassAuthAsEmployee(): Chainable<void>;

      /**
       * Bypass auth and inject manager tokens directly
       */
      bypassAuthAsManager(): Chainable<void>;

      /**
       * Login as employee (redirects to 2FA)
       */
      loginAsEmployee(): Chainable<void>;

      /**
       * Login as manager (redirects to 2FA)
       */
      loginAsManager(): Chainable<void>;

      /**
       * Complete 2FA verification
       */
      complete2FA(code: string): Chainable<void>;

      /**
       * Logout
       */
      logout(): Chainable<void>;

      /**
       * Setup API mocks
       */
      mockAPI(): Chainable<void>;
    }
  }
}

export {};
