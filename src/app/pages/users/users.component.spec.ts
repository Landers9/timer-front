import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UsersComponent } from './users.component';
import { UserService, ApiUser } from '../../services/user.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let consoleSpy: jest.SpyInstance;
  let userServiceMock: {
    getCurrentUser: jest.Mock;
    getAllUsers: jest.Mock;
    createUser: jest.Mock;
    updateUser: jest.Mock;
    deleteUser: jest.Mock;
  };

  // Helper pour créer un ApiUser complet
  const createMockApiUser = (overrides: Partial<ApiUser> = {}): ApiUser => ({
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '+33612345678',
    role: 'EMPLOYEE',
    is_active: true,
    is_verified: true,
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
    device_id: null,
    fingerprint_id: null,
    position: 'Developer',
    department: 'IT',
    hire_date: '2023-01-15',
    created_by: null,
    ...overrides,
  });

  const mockApiUsers: ApiUser[] = [
    createMockApiUser({
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      role: 'EMPLOYEE',
    }),
    createMockApiUser({
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      role: 'MANAGER',
    }),
    createMockApiUser({
      id: 'user-3',
      first_name: 'Bob',
      last_name: 'Admin',
      role: 'ADMIN',
    }),
  ];

  beforeEach(async () => {
    // Silence console.error pendant les tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockCurrentUser = {
      id: 'current-user',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      phone_number: null,
      role: 'ADMIN' as const,
      is_active: true,
      is_verified: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      device_id: null,
      fingerprint_id: null,
      position: null,
      department: null,
      hire_date: null,
      created_by: null,
    };

    userServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of(mockCurrentUser)),
      getAllUsers: jest.fn().mockReturnValue(of(mockApiUsers)),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [{ provide: UserService, useValue: userServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(UsersComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - Load users', () => {
    it('should load users on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
      expect(component.users().length).toBe(3);
      expect(component.isLoadingList()).toBe(false);
    }));

    it('should handle error when loading fails', fakeAsync(() => {
      userServiceMock.getAllUsers.mockReturnValue(
        throwError(() => new Error('Erreur de chargement'))
      );

      fixture.detectChanges();
      tick();

      expect(component.errorMessage()).toBe('Erreur de chargement');
    }));
  });

  describe('filteredUsers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter by search query', () => {
      component.searchQuery.set('Jane');
      expect(component.filteredUsers().length).toBe(1);
      expect(component.filteredUsers()[0].firstName).toBe('Jane');
    });

    it('should filter by role', () => {
      component.roleFilter.set('MANAGER');
      expect(component.filteredUsers().length).toBe(1);
      expect(component.filteredUsers()[0].role).toBe('MANAGER');
    });

    it('should combine filters', () => {
      component.searchQuery.set('john');
      component.roleFilter.set('EMPLOYEE');
      expect(component.filteredUsers().length).toBe(1);
    });
  });

  describe('Modals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open/close create modal', () => {
      component.openCreateModal();
      expect(component.showCreateModal()).toBe(true);

      component.closeModals();
      expect(component.showCreateModal()).toBe(false);
    });

    it('should open edit modal with user data', () => {
      const user = component.users()[0];
      component.openEditModal(user);

      expect(component.showEditModal()).toBe(true);
      expect(component.selectedUser()).toEqual(user);
      expect(component.formData().firstName).toBe(user.firstName);
    });

    it('should open delete modal', () => {
      const user = component.users()[0];
      component.openDeleteModal(user);

      expect(component.showDeleteModal()).toBe(true);
      expect(component.selectedUser()).toEqual(user);
    });

    it('should open details modal', () => {
      const user = component.users()[0];
      component.openDetailsModal(user);

      expect(component.showDetailsModal()).toBe(true);
      expect(component.selectedUser()).toEqual(user);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should create user successfully', fakeAsync(() => {
      const newUser = createMockApiUser({ id: 'user-4', first_name: 'New' });
      userServiceMock.createUser.mockReturnValue(of(newUser));

      component.openCreateModal();
      component.createUser();
      tick();

      expect(component.users().length).toBe(4);
      expect(component.showCreateModal()).toBe(false);
    }));

    it('should handle create error', fakeAsync(() => {
      userServiceMock.createUser.mockReturnValue(
        throwError(() => new Error('Email déjà utilisé'))
      );

      component.openCreateModal();
      component.createUser();
      tick();

      expect(component.errorMessage()).toBe('Email déjà utilisé');
      expect(component.showCreateModal()).toBe(true);
    }));

    it('should update user successfully', fakeAsync(() => {
      const user = component.users()[0];
      const updatedUser = createMockApiUser({
        ...mockApiUsers[0],
        first_name: 'Updated',
      });
      userServiceMock.updateUser.mockReturnValue(of(updatedUser));

      component.openEditModal(user);
      component.updateUser();
      tick();

      expect(component.users()[0].firstName).toBe('Updated');
      expect(component.showEditModal()).toBe(false);
    }));

    it('should handle update error', fakeAsync(() => {
      const user = component.users()[0];
      userServiceMock.updateUser.mockReturnValue(
        throwError(() => new Error('Erreur de mise à jour'))
      );

      component.openEditModal(user);
      component.updateUser();
      tick();

      expect(component.errorMessage()).toBe('Erreur de mise à jour');
    }));

    it('should delete user successfully', fakeAsync(() => {
      const user = component.users()[0];
      userServiceMock.deleteUser.mockReturnValue(of({}));

      component.openDeleteModal(user);
      component.deleteUser();
      tick();

      expect(component.users().length).toBe(2);
      expect(component.users().find((u) => u.id === user.id)).toBeUndefined();
    }));

    it('should handle delete error', fakeAsync(() => {
      const user = component.users()[0];
      userServiceMock.deleteUser.mockReturnValue(
        throwError(() => new Error('Suppression impossible'))
      );

      component.openDeleteModal(user);
      component.deleteUser();
      tick();

      expect(component.errorMessage()).toBe('Suppression impossible');
      expect(component.users().length).toBe(3);
    }));
  });

  describe('Helper methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('getUserFullName should return full name', () => {
      const user = component.users()[0];
      expect(component.getUserFullName(user)).toBe('John Doe');
    });

    it('getRoleBadgeClass should return correct class', () => {
      expect(component.getRoleBadgeClass('ADMIN')).toBe('badge-primary');
      expect(component.getRoleBadgeClass('MANAGER')).toBe('badge-info');
      expect(component.getRoleBadgeClass('EMPLOYEE')).toBe('badge-secondary');
    });

    it('getRoleLabel should return French labels', () => {
      expect(component.getRoleLabel('ADMIN')).toBe('Administrateur');
      expect(component.getRoleLabel('MANAGER')).toBe('Manager');
      expect(component.getRoleLabel('EMPLOYEE')).toBe('Employé');
    });

    it('formatDate should format date correctly', () => {
      const result = component.formatDate('2023-01-15');
      expect(result).toContain('2023');
    });

    it('formatDate should return N/A for null', () => {
      expect(component.formatDate(null)).toBe('N/A');
    });
  });
});
