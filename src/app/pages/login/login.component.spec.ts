import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: { login: jest.Mock };
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      login: jest.fn(),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
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

    it('should have empty password', () => {
      expect(component.password()).toBe('');
    });

    it('should have password hidden', () => {
      expect(component.showPassword()).toBe(false);
    });

    it('should not be loading', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have no error message', () => {
      expect(component.errorMessage()).toBe('');
    });
  });

  describe('togglePasswordVisibility', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword()).toBe(false);

      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);

      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should show error when fields are empty', () => {
      component.email.set('');
      component.password.set('');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez remplir tous les champs');
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', () => {
      component.email.set('');
      component.password.set('password123');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez remplir tous les champs');
    });

    it('should show error when password is empty', () => {
      component.email.set('test@test.com');
      component.password.set('');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez remplir tous les champs');
    });

    it('should show error for invalid email format', () => {
      component.email.set('invalid-email');
      component.password.set('password123');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer un email valide');
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should show error for email without domain', () => {
      component.email.set('test@');
      component.password.set('password123');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer un email valide');
    });
  });

  describe('successful login', () => {
    const mockResponse = {
      requires_verification: true,
      message: 'Code envoyé',
      token: 'verification-token',
    };

    beforeEach(() => {
      authServiceMock.login.mockReturnValue(of(mockResponse));
    });

    it('should call authService.login with credentials', fakeAsync(() => {
      component.email.set('test@test.com');
      component.password.set('password123');

      component.onSubmit();
      tick();

      expect(authServiceMock.login).toHaveBeenCalledWith(
        'test@test.com',
        'password123'
      );
    }));

    it('should set loading to false after login completes', fakeAsync(() => {
      component.email.set('test@test.com');
      component.password.set('password123');

      component.onSubmit();
      tick();

      // After completion, loading should be false
      expect(component.isLoading()).toBe(false);
    }));

    it('should navigate to verify-2fa when verification is required', fakeAsync(() => {
      component.email.set('test@test.com');
      component.password.set('password123');

      component.onSubmit();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/verify-2fa']);
    }));

    it('should clear error message on submit', fakeAsync(() => {
      component.errorMessage.set('Previous error');
      component.email.set('test@test.com');
      component.password.set('password123');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('');
    }));
  });

  describe('failed login', () => {
    it('should display error message on login failure', fakeAsync(() => {
      authServiceMock.login.mockReturnValue(
        throwError(() => new Error('Email ou mot de passe incorrect'))
      );

      component.email.set('test@test.com');
      component.password.set('wrongpassword');

      component.onSubmit();
      tick();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Email ou mot de passe incorrect');
    }));

    it('should display generic error when no message provided', fakeAsync(() => {
      authServiceMock.login.mockReturnValue(throwError(() => ({})));

      component.email.set('test@test.com');
      component.password.set('password123');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Erreur de connexion');
    }));
  });
});
