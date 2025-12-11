import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../services/user.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let consoleSpy: jest.SpyInstance;
  let userServiceMock: {
    getCurrentUser: jest.Mock;
    updateUser: jest.Mock;
    changePassword: jest.Mock;
  };

  const mockUserResponse = {
    id: 'user-1',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '0612345678',
    role: 'EMPLOYEE' as const,
    created_at: '2024-01-01T00:00:00Z',
    department: 'IT',
    position: 'Developer',
  };

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    userServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of(mockUserResponse)),
      updateUser: jest.fn().mockReturnValue(of(mockUserResponse)),
      changePassword: jest.fn().mockReturnValue(of({ detail: 'Success' })),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: UserService, useValue: userServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ProfileComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load user profile', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(userServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(component.userProfile().firstName).toBe('John');
      expect(component.userProfile().lastName).toBe('Doe');
      expect(component.isLoadingProfile()).toBe(false);
    }));

    it('should handle error when loading profile', fakeAsync(() => {
      userServiceMock.getCurrentUser.mockReturnValue(
        throwError(() => ({ message: 'API Error' }))
      );

      fixture.detectChanges();
      tick();

      expect(component.profileError()).toBe('API Error');
      expect(component.isLoadingProfile()).toBe(false);
    }));
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('fullName should return firstName + lastName', () => {
      expect(component.fullName()).toBe('John Doe');
    });

    it('avatarUrl should generate URL with name', () => {
      expect(component.avatarUrl()).toContain('John+Doe');
      expect(component.avatarUrl()).toContain('ui-avatars.com');
    });

    it('memberSince should calculate months', () => {
      // Le profil a été créé le 2024-01-01
      expect(typeof component.memberSince()).toBe('number');
    });
  });

  describe('Edit mode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('enterEditMode should copy profile to formData', () => {
      component.enterEditMode();

      expect(component.isEditMode()).toBe(true);
      expect(component.formData().firstName).toBe('John');
      expect(component.formData().lastName).toBe('Doe');
    });

    it('cancelEdit should exit edit mode and clear formData', () => {
      component.enterEditMode();
      component.cancelEdit();

      expect(component.isEditMode()).toBe(false);
      expect(component.formData()).toEqual({});
    });

    it('saveProfile should validate required fields', () => {
      component.enterEditMode();
      component.formData.set({ firstName: '', lastName: '', email: '' });

      component.saveProfile();

      expect(component.profileError()).toBe(
        'Veuillez remplir tous les champs obligatoires'
      );
    });

    it('saveProfile should call updateUser on success', fakeAsync(() => {
      component.enterEditMode();
      component.formData.set({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });

      component.saveProfile();
      tick();

      expect(userServiceMock.updateUser).toHaveBeenCalled();
      expect(component.isEditMode()).toBe(false);
      expect(component.successMessage()).toBe(
        'Profil mis à jour avec succès !'
      );

      tick(3000); // Clear success message
    }));

    it('saveProfile should handle error', fakeAsync(() => {
      userServiceMock.updateUser.mockReturnValue(
        throwError(() => ({ message: 'Update failed' }))
      );

      component.enterEditMode();
      component.formData.set({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });

      component.saveProfile();
      tick();

      expect(component.profileError()).toBe('Update failed');
      expect(component.isSavingProfile()).toBe(false);
    }));
  });

  describe('Password change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('openPasswordModal should reset form and show modal', () => {
      component.openPasswordModal();

      expect(component.showPasswordModal()).toBe(true);
      expect(component.passwordForm().currentPassword).toBe('');
      expect(component.passwordForm().newPassword).toBe('');
      expect(component.passwordForm().confirmPassword).toBe('');
    });

    it('closePasswordModal should hide modal', () => {
      component.openPasswordModal();
      component.closePasswordModal();

      expect(component.showPasswordModal()).toBe(false);
    });

    it('changePassword should validate empty fields', () => {
      component.openPasswordModal();
      component.changePassword();

      expect(component.passwordError()).toBe(
        'Veuillez remplir tous les champs'
      );
    });

    it('changePassword should validate password match', () => {
      component.openPasswordModal();
      component.passwordForm.set({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'different123',
      });

      component.changePassword();

      expect(component.passwordError()).toBe(
        'Les mots de passe ne correspondent pas'
      );
    });

    it('changePassword should validate minimum length', () => {
      component.openPasswordModal();
      component.passwordForm.set({
        currentPassword: 'oldpass',
        newPassword: 'short',
        confirmPassword: 'short',
      });

      component.changePassword();

      expect(component.passwordError()).toBe(
        'Le mot de passe doit contenir au moins 8 caractères'
      );
    });

    it('changePassword should call service on valid input', fakeAsync(() => {
      component.openPasswordModal();
      component.passwordForm.set({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      component.changePassword();
      tick();

      expect(userServiceMock.changePassword).toHaveBeenCalledWith('user-1', {
        old_password: 'oldpassword',
        new_password: 'newpassword123',
      });
      expect(component.showPasswordModal()).toBe(false);
      expect(component.successMessage()).toBe(
        'Mot de passe changé avec succès !'
      );

      tick(3000);
    }));

    it('changePassword should handle error', fakeAsync(() => {
      userServiceMock.changePassword.mockReturnValue(
        throwError(() => ({ message: 'Wrong password' }))
      );

      component.openPasswordModal();
      component.passwordForm.set({
        currentPassword: 'wrongpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      component.changePassword();
      tick();

      expect(component.passwordError()).toBe('Wrong password');
      expect(component.isChangingPassword()).toBe(false);
    }));
  });

  describe('Helper methods', () => {
    it('formatJoinDate should format date in French', () => {
      const date = new Date(2024, 0, 15);
      const result = component.formatJoinDate(date);

      expect(result).toContain('2024');
      expect(result.toLowerCase()).toContain('janvier');
    });

    it('getRoleBadge should return correct class', () => {
      expect(component.getRoleBadge('MANAGER')).toBe('badge-primary');
      expect(component.getRoleBadge('ADMIN')).toBe('badge-primary');
      expect(component.getRoleBadge('EMPLOYEE')).toBe('badge-secondary');
    });

    it('getRoleLabel should return correct label', () => {
      expect(component.getRoleLabel('MANAGER')).toBe('Manager');
      expect(component.getRoleLabel('ADMIN')).toBe('Administrateur');
      expect(component.getRoleLabel('EMPLOYEE')).toBe('Employé');
    });
  });

  describe('Password visibility toggles', () => {
    it('should toggle password visibility signals', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.showCurrentPassword()).toBe(false);
      component.showCurrentPassword.set(true);
      expect(component.showCurrentPassword()).toBe(true);

      expect(component.showNewPassword()).toBe(false);
      component.showNewPassword.set(true);
      expect(component.showNewPassword()).toBe(true);

      expect(component.showConfirmPassword()).toBe(false);
      component.showConfirmPassword.set(true);
      expect(component.showConfirmPassword()).toBe(true);
    }));
  });

  describe('Initial state', () => {
    it('should have correct initial values', () => {
      expect(component.isLoadingProfile()).toBe(true);
      expect(component.isSavingProfile()).toBe(false);
      expect(component.isChangingPassword()).toBe(false);
      expect(component.isEditMode()).toBe(false);
      expect(component.showPasswordModal()).toBe(false);
      expect(component.profileError()).toBeNull();
      expect(component.passwordError()).toBeNull();
      expect(component.successMessage()).toBeNull();
    });
  });
});
