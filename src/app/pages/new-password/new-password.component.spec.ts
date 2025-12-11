import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NewPasswordComponent } from './new-password.component';
import { AuthService } from '../../services/auth.service';

describe('NewPasswordComponent', () => {
  let component: NewPasswordComponent;
  let fixture: ComponentFixture<NewPasswordComponent>;
  let authServiceMock: {
    resetToken: jest.Mock;
    confirmPasswordReset: jest.Mock;
  };
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      resetToken: jest.fn().mockReturnValue('valid-reset-token'),
      confirmPasswordReset: jest.fn(),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NewPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(NewPasswordComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NewPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to forgot-password if no reset token', () => {
      authServiceMock.resetToken.mockReturnValue(null);

      fixture.detectChanges();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/forgot-password']);
    });

    it('should not redirect if reset token exists', () => {
      authServiceMock.resetToken.mockReturnValue('valid-reset-token');

      fixture.detectChanges();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('password validation computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate minimum length', () => {
      component.newPassword.set('1234567');
      expect(component.hasMinLength()).toBe(false);

      component.newPassword.set('12345678');
      expect(component.hasMinLength()).toBe(true);
    });

    it('should validate uppercase', () => {
      component.newPassword.set('password');
      expect(component.hasUpperCase()).toBe(false);

      component.newPassword.set('Password');
      expect(component.hasUpperCase()).toBe(true);
    });

    it('should validate lowercase', () => {
      component.newPassword.set('PASSWORD');
      expect(component.hasLowerCase()).toBe(false);

      component.newPassword.set('PASSWORd');
      expect(component.hasLowerCase()).toBe(true);
    });

    it('should validate number', () => {
      component.newPassword.set('Password');
      expect(component.hasNumber()).toBe(false);

      component.newPassword.set('Password1');
      expect(component.hasNumber()).toBe(true);
    });

    it('should validate special character', () => {
      component.newPassword.set('Password1');
      expect(component.hasSpecialChar()).toBe(false);

      component.newPassword.set('Password1!');
      expect(component.hasSpecialChar()).toBe(true);
    });

    it('should validate complete password', () => {
      component.newPassword.set('weak');
      expect(component.isPasswordValid()).toBe(false);

      component.newPassword.set('StrongP@ss1');
      expect(component.isPasswordValid()).toBe(true);
    });
  });

  describe('passwordsMatch computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when passwords do not match', () => {
      component.newPassword.set('Password1!');
      component.confirmPassword.set('Password2!');

      expect(component.passwordsMatch()).toBe(false);
    });

    it('should return false when confirm is empty', () => {
      component.newPassword.set('Password1!');
      component.confirmPassword.set('');

      expect(component.passwordsMatch()).toBe(false);
    });

    it('should return true when passwords match', () => {
      component.newPassword.set('Password1!');
      component.confirmPassword.set('Password1!');

      expect(component.passwordsMatch()).toBe(true);
    });
  });

  describe('togglePasswordVisibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle new password visibility', () => {
      expect(component.showNewPassword()).toBe(false);

      component.toggleNewPasswordVisibility();
      expect(component.showNewPassword()).toBe(true);

      component.toggleNewPasswordVisibility();
      expect(component.showNewPassword()).toBe(false);
    });

    it('should toggle confirm password visibility', () => {
      expect(component.showConfirmPassword()).toBe(false);

      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(true);

      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(false);
    });
  });

  describe('updatePasswordStrength', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set empty strength for empty password', () => {
      component.newPassword.set('');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('');
    });

    it('should set weak strength for simple password', () => {
      component.newPassword.set('abc');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('weak');
    });

    it('should set medium strength for moderate password', () => {
      component.newPassword.set('Password1');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('medium');
    });

    it('should set strong strength for complex password', () => {
      component.newPassword.set('StrongP@ss1!');
      component.updatePasswordStrength();

      expect(component.passwordStrength()).toBe('strong');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error if password is invalid', () => {
      component.newPassword.set('weak');
      component.confirmPassword.set('weak');

      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Le mot de passe ne respecte pas les critères'
      );
      expect(authServiceMock.confirmPasswordReset).not.toHaveBeenCalled();
    });

    it('should show error if passwords do not match', () => {
      component.newPassword.set('StrongP@ss1!');
      component.confirmPassword.set('DifferentP@ss1!');

      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Les mots de passe ne correspondent pas'
      );
      expect(authServiceMock.confirmPasswordReset).not.toHaveBeenCalled();
    });

    it('should call confirmPasswordReset with valid password', fakeAsync(() => {
      authServiceMock.confirmPasswordReset.mockReturnValue(
        of({ success: true })
      );
      component.newPassword.set('StrongP@ss1!');
      component.confirmPassword.set('StrongP@ss1!');

      component.onSubmit();
      tick();

      expect(authServiceMock.confirmPasswordReset).toHaveBeenCalledWith(
        'StrongP@ss1!'
      );
    }));

    it('should navigate to login on success', fakeAsync(() => {
      authServiceMock.confirmPasswordReset.mockReturnValue(
        of({ success: true })
      );
      component.newPassword.set('StrongP@ss1!');
      component.confirmPassword.set('StrongP@ss1!');

      component.onSubmit();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        state: { message: 'Mot de passe réinitialisé avec succès' },
      });
    }));

    it('should show error on failure', fakeAsync(() => {
      authServiceMock.confirmPasswordReset.mockReturnValue(
        throwError(() => new Error('Token expiré'))
      );
      component.newPassword.set('StrongP@ss1!');
      component.confirmPassword.set('StrongP@ss1!');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Token expiré');
      expect(component.isLoading()).toBe(false);
    }));
  });
});
