import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { TwoFactorAuthComponent } from './two-factor-auth.component';
import { AuthService } from '../../services/auth.service';

describe('TwoFactorAuthComponent', () => {
  let component: TwoFactorAuthComponent;
  let fixture: ComponentFixture<TwoFactorAuthComponent>;
  let authServiceMock: {
    verificationToken: jest.Mock;
    verifyLoginCode: jest.Mock;
    resendLoginCode: jest.Mock;
  };
  let routerMock: {
    navigate: jest.Mock;
  };

  beforeEach(async () => {
    authServiceMock = {
      verificationToken: jest.fn().mockReturnValue('valid-token'),
      verifyLoginCode: jest.fn().mockReturnValue(of({ success: true })),
      resendLoginCode: jest
        .fn()
        .mockReturnValue(of({ message: 'Code envoyé' })),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TwoFactorAuthComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TwoFactorAuthComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TwoFactorAuthComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to login if no verification token', () => {
      authServiceMock.verificationToken.mockReturnValue(null);

      fixture.detectChanges();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not redirect if verification token exists', () => {
      authServiceMock.verificationToken.mockReturnValue('valid-token');

      fixture.detectChanges();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('onCodeInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should only allow digits', () => {
      const event = { target: { value: 'abc123def456' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.otpCode()).toBe('123456');
    });

    it('should limit to 6 digits', () => {
      const event = { target: { value: '12345678' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.otpCode()).toBe('123456');
    });

    it('should clear error message on input', () => {
      component.errorMessage.set('Previous error');
      const event = { target: { value: '123' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.errorMessage()).toBe('');
    });

    it('should handle empty input', () => {
      const event = { target: { value: '' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.otpCode()).toBe('');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error if code is less than 6 digits', () => {
      component.otpCode.set('12345');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer les 6 chiffres');
      expect(authServiceMock.verifyLoginCode).not.toHaveBeenCalled();
    });

    it('should show error if code is empty', () => {
      component.otpCode.set('');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer les 6 chiffres');
    });

    it('should call verifyLoginCode with correct code', fakeAsync(() => {
      component.otpCode.set('123456');

      component.onSubmit();
      tick();

      expect(authServiceMock.verifyLoginCode).toHaveBeenCalledWith('123456');
    }));

    it('should set loading to true while verifying', fakeAsync(() => {
      const subject = new Subject<any>();
      authServiceMock.verifyLoginCode.mockReturnValue(subject.asObservable());
      component.otpCode.set('123456');

      component.onSubmit();

      expect(component.isLoading()).toBe(true);

      subject.next({ success: true });
      subject.complete();
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should navigate to dashboard on success', fakeAsync(() => {
      component.otpCode.set('123456');

      component.onSubmit();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component.isLoading()).toBe(false);
    }));

    it('should show error and clear code on failure', fakeAsync(() => {
      authServiceMock.verifyLoginCode.mockReturnValue(
        throwError(() => new Error('Code invalide'))
      );
      component.otpCode.set('123456');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Code invalide');
      expect(component.otpCode()).toBe('');
      expect(component.isLoading()).toBe(false);
    }));

    it('should display generic error when no message provided', fakeAsync(() => {
      authServiceMock.verifyLoginCode.mockReturnValue(throwError(() => ({})));
      component.otpCode.set('123456');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe(
        'Code incorrect. Veuillez réessayer.'
      );
    }));

    it('should clear error message before submit', fakeAsync(() => {
      component.errorMessage.set('Previous error');
      component.otpCode.set('123456');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('');
    }));
  });

  describe('resendCode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call resendLoginCode', fakeAsync(() => {
      component.resendCode();
      tick();
      tick(3000); // Flush le setTimeout du message de succès

      expect(authServiceMock.resendLoginCode).toHaveBeenCalled();
    }));

    it('should set isResending to true while sending', fakeAsync(() => {
      const subject = new Subject<any>();
      authServiceMock.resendLoginCode.mockReturnValue(subject.asObservable());

      component.resendCode();

      expect(component.isResending()).toBe(true);

      subject.next({ message: 'Code envoyé' });
      subject.complete();
      tick();
      tick(3000); // Flush le setTimeout

      expect(component.isResending()).toBe(false);
    }));

    it('should show success message on success', fakeAsync(() => {
      component.resendCode();
      tick();

      expect(component.successMessage()).toBe(
        'Un nouveau code a été envoyé à votre email'
      );
      expect(component.isResending()).toBe(false);

      tick(3000); // Flush le setTimeout
    }));

    it('should clear OTP code on success', fakeAsync(() => {
      component.otpCode.set('123456');

      component.resendCode();
      tick();

      expect(component.otpCode()).toBe('');

      tick(3000); // Flush le setTimeout
    }));

    it('should clear success message after 3 seconds', fakeAsync(() => {
      component.resendCode();
      tick();

      expect(component.successMessage()).toBe(
        'Un nouveau code a été envoyé à votre email'
      );

      tick(3000);

      expect(component.successMessage()).toBe('');
    }));

    it('should show error on failure', fakeAsync(() => {
      authServiceMock.resendLoginCode.mockReturnValue(
        throwError(() => new Error('Erreur serveur'))
      );

      component.resendCode();
      tick();

      expect(component.errorMessage()).toBe('Erreur serveur');
      expect(component.isResending()).toBe(false);
    }));

    it('should display generic error when no message provided', fakeAsync(() => {
      authServiceMock.resendLoginCode.mockReturnValue(throwError(() => ({})));

      component.resendCode();
      tick();

      expect(component.errorMessage()).toBe('Erreur lors du renvoi du code');
    }));

    it('should clear messages before resend', fakeAsync(() => {
      component.errorMessage.set('Previous error');
      component.successMessage.set('Previous success');

      component.resendCode();
      tick();

      // Error and success should be cleared at start
      expect(component.errorMessage()).toBe('');

      tick(3000); // Flush le setTimeout
    }));
  });

  describe('resendOtp alias', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call resendCode', fakeAsync(() => {
      const resendCodeSpy = jest.spyOn(component, 'resendCode');

      component.resendOtp();
      tick();
      tick(3000); // Flush le setTimeout

      expect(resendCodeSpy).toHaveBeenCalled();
    }));
  });

  describe('Initial state', () => {
    it('should have empty OTP code', () => {
      expect(component.otpCode()).toBe('');
    });

    it('should not be loading', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should not be resending', () => {
      expect(component.isResending()).toBe(false);
    });

    it('should have no error message', () => {
      expect(component.errorMessage()).toBe('');
    });

    it('should have no success message', () => {
      expect(component.successMessage()).toBe('');
    });
  });
});
