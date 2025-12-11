import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../services/auth.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceMock: { requestPasswordReset: jest.Mock };
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      requestPasswordReset: jest.fn(),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ForgotPasswordComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty email', () => {
      expect(component.email()).toBe('');
    });

    it('should not be loading', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have no error message', () => {
      expect(component.errorMessage()).toBe('');
    });
  });

  describe('form validation', () => {
    it('should show error when email is empty', () => {
      component.email.set('');

      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Veuillez entrer votre adresse email'
      );
      expect(authServiceMock.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should show error for invalid email format', () => {
      component.email.set('invalid-email');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer un email valide');
      expect(authServiceMock.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should show error for email without domain', () => {
      component.email.set('test@');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer un email valide');
    });
  });

  describe('successful submission', () => {
    beforeEach(() => {
      authServiceMock.requestPasswordReset.mockReturnValue(
        of({ message: 'Code envoyé' })
      );
    });

    it('should call requestPasswordReset with email', fakeAsync(() => {
      component.email.set('test@example.com');

      component.onSubmit();
      tick();

      expect(authServiceMock.requestPasswordReset).toHaveBeenCalledWith(
        'test@example.com'
      );
    }));

    it('should navigate to verify-reset-code on success', fakeAsync(() => {
      component.email.set('test@example.com');

      component.onSubmit();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/verify-reset-code']);
    }));

    it('should set loading to false after completion', fakeAsync(() => {
      component.email.set('test@example.com');

      component.onSubmit();
      tick();

      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('failed submission', () => {
    it('should display error message on failure', fakeAsync(() => {
      authServiceMock.requestPasswordReset.mockReturnValue(
        throwError(() => new Error('Email non trouvé'))
      );
      component.email.set('test@example.com');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Email non trouvé');
      expect(component.isLoading()).toBe(false);
    }));

    it('should display generic error when no message', fakeAsync(() => {
      authServiceMock.requestPasswordReset.mockReturnValue(
        throwError(() => ({}))
      );
      component.email.set('test@example.com');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe("Erreur lors de l'envoi du code");
    }));
  });
});
