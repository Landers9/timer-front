import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let consoleSpy: jest.SpyInstance;

  let authServiceMock: {
    currentUser: jest.Mock;
    logout: jest.Mock;
  };
  let userServiceMock: { getCurrentUser: jest.Mock };
  let routerMock: { navigate: jest.Mock };

  const mockUserResponse = {
    id: 'user-1',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'MANAGER' as const,
  };

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.innerWidth for desktop view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    authServiceMock = {
      currentUser: jest.fn().mockReturnValue(null),
      logout: jest.fn().mockReturnValue(of({})),
    };

    userServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of(mockUserResponse)),
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(MainLayoutComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(userServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUser()?.firstName).toBe('John');
      expect(component.currentUser()?.lastName).toBe('Doe');
      expect(component.isLoadingUser()).toBe(false);
    }));

    it('should handle error and fallback to authService user', fakeAsync(() => {
      userServiceMock.getCurrentUser.mockReturnValue(
        throwError(() => ({ message: 'API Error' }))
      );
      authServiceMock.currentUser.mockReturnValue({
        first_name: 'Fallback',
        last_name: 'User',
        role: 'EMPLOYEE',
      });

      fixture.detectChanges();
      tick();

      expect(component.currentUser()?.firstName).toBe('Fallback');
      expect(component.isLoadingUser()).toBe(false);
    }));
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('menuItems should filter by role for MANAGER', () => {
      // MANAGER should see all menu items
      const menuItems = component.menuItems();
      expect(menuItems.length).toBeGreaterThan(3);
      expect(menuItems.some((item) => item.label === 'Teams')).toBe(true);
      expect(menuItems.some((item) => item.label === 'Users')).toBe(true);
    });

    it('menuItems should filter restricted items for EMPLOYEE', fakeAsync(() => {
      // Recreate with EMPLOYEE role
      userServiceMock.getCurrentUser.mockReturnValue(
        of({ ...mockUserResponse, role: 'EMPLOYEE' })
      );

      const newFixture = TestBed.createComponent(MainLayoutComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      const menuItems = newComponent.menuItems();
      expect(menuItems.some((item) => item.label === 'Teams')).toBe(false);
      expect(menuItems.some((item) => item.label === 'Users')).toBe(false);
      expect(menuItems.some((item) => item.label === 'Dashboard')).toBe(true);
    }));

    it('isManager should return true for MANAGER role', () => {
      expect(component.isManager()).toBe(true);
    });

    it('isManager should return false for EMPLOYEE role', fakeAsync(() => {
      userServiceMock.getCurrentUser.mockReturnValue(
        of({ ...mockUserResponse, role: 'EMPLOYEE' })
      );

      const newFixture = TestBed.createComponent(MainLayoutComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.isManager()).toBe(false);
    }));

    it('managerSidebarMenuItems should return items for MANAGER', () => {
      const items = component.managerSidebarMenuItems();
      expect(items.length).toBe(4); // Dashboard, Teams, Users, Reports
    });

    it('managerSidebarMenuItems should be empty for EMPLOYEE', fakeAsync(() => {
      userServiceMock.getCurrentUser.mockReturnValue(
        of({ ...mockUserResponse, role: 'EMPLOYEE' })
      );

      const newFixture = TestBed.createComponent(MainLayoutComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.managerSidebarMenuItems().length).toBe(0);
    }));
  });

  describe('Sidebar toggle', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('toggleSidebar should toggle in desktop view', () => {
      component.isMobileView.set(false);
      const initialState = component.isSidebarOpen();

      component.toggleSidebar();

      expect(component.isSidebarOpen()).toBe(!initialState);
    });

    it('toggleSidebar should not toggle in mobile view', () => {
      component.isMobileView.set(true);
      const initialState = component.isSidebarOpen();

      component.toggleSidebar();

      expect(component.isSidebarOpen()).toBe(initialState);
    });
  });

  describe('Mobile menu', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('toggleMobileMenu should toggle mobile menu', () => {
      expect(component.isMobileMenuOpen()).toBe(false);

      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(true);

      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(false);
    });

    it('closeMobileMenu should close mobile menu', () => {
      component.isMobileMenuOpen.set(true);

      component.closeMobileMenu();

      expect(component.isMobileMenuOpen()).toBe(false);
    });
  });

  describe('Responsive behavior', () => {
    it('should detect mobile view when width < 768', fakeAsync(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });

      fixture.detectChanges();
      tick();

      // Trigger resize detection
      component.onResize({});

      expect(component.isMobileView()).toBe(true);
      expect(component.isSidebarOpen()).toBe(false);
    }));

    it('should detect desktop view when width >= 768', fakeAsync(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });

      fixture.detectChanges();
      tick();

      component.onResize({});

      expect(component.isMobileView()).toBe(false);
    }));
  });

  describe('Logout', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call authService.logout and navigate to login', fakeAsync(() => {
      component.logout();
      tick();

      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should navigate to login even if logout fails', fakeAsync(() => {
      authServiceMock.logout.mockReturnValue(
        throwError(() => ({ message: 'Logout failed' }))
      );

      component.logout();
      tick();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });

  describe('Initial state', () => {
    it('should have correct default values', () => {
      expect(component.isSidebarOpen()).toBe(true);
      expect(component.isMobileMenuOpen()).toBe(false);
      expect(component.isLoadingUser()).toBe(true);
      expect(component.currentUser()).toBeNull();
      expect(component.notificationCount()).toBe(10);
    });

    it('should have all menu items defined', () => {
      expect(component.allMenuItems.length).toBe(6);
      expect(component.allMenuItems[0].label).toBe('Dashboard');
      expect(component.allMenuItems[5].label).toBe('Profile');
    });
  });
});
