import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../services/auth.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  let authServiceMock: any;
  let routerMock: { navigate: jest.Mock };
  let activatedRouteMock: any;

  beforeEach(async () => {
    authServiceMock = {};

    routerMock = {
      navigate: jest.fn(),
    };

    // Par défaut, token valide
    activatedRouteMock = {
      queryParams: of({ token: 'valid-reset-token' }),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ResetPasswordComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should get token from query params', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.token()).toBe('valid-reset-token');
      expect(component.isInvalidToken()).toBe(false);
    }));

    it('should set isInvalidToken to true if no token', fakeAsync(() => {
      // Recréer avec token vide
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ResetPasswordComponent],
        providers: [
          { provide: AuthService, useValue: authServiceMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).overrideComponent(ResetPasswordComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      });

      const newFixture = TestBed.createComponent(ResetPasswordComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.token()).toBe('');
      expect(newComponent.isInvalidToken()).toBe(true);
    }));
  });

  describe('updatePasswordStrength', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set weak for password < 8 chars', () => {
      component.password.set('1234567');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('weak');
    });

    it('should set medium for password without uppercase or number', () => {
      component.password.set('password');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('medium');
    });

    it('should set medium for password < 12 chars', () => {
      component.password.set('Password1');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('medium');
    });

    it('should set strong for password >= 12 chars with uppercase and number', () => {
      component.password.set('Password1234');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('strong');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error if passwords do not match', () => {
      component.password.set('Password123!');
      component.confirmPassword.set('DifferentPass!');

      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Les mots de passe ne correspondent pas'
      );
      expect(component.isLoading()).toBe(false);
    });

    it('should show error if password < 8 chars', () => {
      component.password.set('Pass1!');
      component.confirmPassword.set('Pass1!');

      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Le mot de passe doit contenir au moins 8 caractères'
      );
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading to true on valid submit', () => {
      component.password.set('Password123!');
      component.confirmPassword.set('Password123!');

      component.onSubmit();

      expect(component.isLoading()).toBe(true);
      expect(component.errorMessage()).toBe('');
    });

    it('should set isSubmitted to true after timeout', fakeAsync(() => {
      component.password.set('Password123!');
      component.confirmPassword.set('Password123!');

      component.onSubmit();
      expect(component.isSubmitted()).toBe(false);

      tick(1000); // Wait for setTimeout

      expect(component.isSubmitted()).toBe(true);
    }));

    it('should clear previous error message on submit', () => {
      component.errorMessage.set('Previous error');
      component.password.set('Password123!');
      component.confirmPassword.set('Password123!');

      component.onSubmit();

      expect(component.errorMessage()).toBe('');
    });
  });

  describe('goToLogin', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to login page', () => {
      component.goToLogin();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Password visibility toggles', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle showPassword', () => {
      expect(component.showPassword()).toBe(false);

      component.showPassword.set(true);
      expect(component.showPassword()).toBe(true);

      component.showPassword.set(false);
      expect(component.showPassword()).toBe(false);
    });

    it('should toggle showConfirmPassword', () => {
      expect(component.showConfirmPassword()).toBe(false);

      component.showConfirmPassword.set(true);
      expect(component.showConfirmPassword()).toBe(true);
    });
  });

  describe('Initial state', () => {
    it('should have correct default values', () => {
      expect(component.password()).toBe('');
      expect(component.confirmPassword()).toBe('');
      expect(component.showPassword()).toBe(false);
      expect(component.showConfirmPassword()).toBe(false);
      expect(component.isLoading()).toBe(false);
      expect(component.isSubmitted()).toBe(false);
      expect(component.errorMessage()).toBe('');
      expect(component.passwordStrength()).toBe('weak');
    });
  });
});
