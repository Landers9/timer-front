import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { VerifyResetCodeComponent } from './verify-reset-code.component';
import { AuthService } from '../../services/auth.service';

describe('VerifyResetCodeComponent', () => {
  let component: VerifyResetCodeComponent;
  let fixture: ComponentFixture<VerifyResetCodeComponent>;
  let authServiceMock: {
    resetToken: jest.Mock;
    verifyResetCode: jest.Mock;
  };
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      resetToken: jest.fn().mockReturnValue('valid-reset-token'),
      verifyResetCode: jest.fn(),
    };

    routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyResetCodeComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(VerifyResetCodeComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VerifyResetCodeComponent);
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

  describe('onCodeInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should only allow digits', () => {
      const event = { target: { value: 'abc123def456' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.resetCode()).toBe('123456');
    });

    it('should limit to 6 digits', () => {
      const event = { target: { value: '12345678' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.resetCode()).toBe('123456');
    });

    it('should clear error message on input', () => {
      component.errorMessage.set('Previous error');
      const event = { target: { value: '123' } } as unknown as Event;

      component.onCodeInput(event);

      expect(component.errorMessage()).toBe('');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error if code is less than 6 digits', () => {
      component.resetCode.set('12345');

      component.onSubmit();

      expect(component.errorMessage()).toBe('Veuillez entrer les 6 chiffres');
      expect(authServiceMock.verifyResetCode).not.toHaveBeenCalled();
    });

    it('should call verifyResetCode with correct code', fakeAsync(() => {
      authServiceMock.verifyResetCode.mockReturnValue(of({ success: true }));
      component.resetCode.set('123456');

      component.onSubmit();
      tick();

      expect(authServiceMock.verifyResetCode).toHaveBeenCalledWith('123456');
    }));

    it('should navigate to new-password on success', fakeAsync(() => {
      authServiceMock.verifyResetCode.mockReturnValue(of({ success: true }));
      component.resetCode.set('123456');

      component.onSubmit();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/new-password']);
    }));

    it('should show error and clear code on failure', fakeAsync(() => {
      authServiceMock.verifyResetCode.mockReturnValue(
        throwError(() => new Error('Code invalide'))
      );
      component.resetCode.set('123456');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Code invalide');
      expect(component.resetCode()).toBe('');
      expect(component.isLoading()).toBe(false);
    }));

    it('should display generic error when no message', fakeAsync(() => {
      authServiceMock.verifyResetCode.mockReturnValue(throwError(() => ({})));
      component.resetCode.set('123456');

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe(
        'Code incorrect. Veuillez réessayer.'
      );
    }));
  });
});
