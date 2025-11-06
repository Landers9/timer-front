// src/app/layouts/main-layout/main-layout.component.ts
import { Component, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
} from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  User,
  Users,
  UserCheck,
  LogOut,
  Menu,
  Bell,
  Clock,
  ClipboardList,
  X,
} from 'lucide-angular';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: ('employee' | 'manager')[];
}

interface MockUser {
  firstName: string;
  lastName: string;
  role: 'employee' | 'manager';
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  isSidebarOpen = signal(true);
  searchQuery = signal('');
  notificationCount = signal(10);
  isMobileView = signal(false);
  isMobileMenuOpen = signal(false);

  // Changez le rôle ici pour tester: 'employee' ou 'manager'
  currentUserRole = signal<'employee' | 'manager'>('manager');

  // Utilisateur simulé pour les tests
  mockUser = computed<MockUser>(() => ({
    firstName: 'John',
    lastName: 'Doe',
    role: this.currentUserRole(),
  }));

  // Menu items pour desktop sidebar (tous les rôles)
  allMenuItems: MenuItem[] = [
    { icon: 'layout-dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'clock', label: 'Clock', route: '/clock' },
    { icon: 'users', label: 'Teams', route: '/teams', roles: ['manager'] },
    { icon: 'user-check', label: 'Users', route: '/users', roles: ['manager'] },
    {
      icon: 'clipboard-list',
      label: 'Reports',
      route: '/reports',
      roles: ['manager'],
    },
    { icon: 'user', label: 'Profile', route: '/profile' },
  ];

  // Menu items pour desktop sidebar (filtré par rôle)
  menuItems = computed(() => {
    const user = this.mockUser();
    return this.allMenuItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role || 'employee');
    });
  });

  // Menu items pour mobile sidebar manager (Dashboard, Teams, Users, Reports)
  managerSidebarMenuItems = computed(() => {
    const user = this.mockUser();
    if (user?.role === 'manager') {
      return [
        this.allMenuItems[0], // Dashboard
        this.allMenuItems[2], // Teams
        this.allMenuItems[3], // Users
        this.allMenuItems[4], // Reports
      ];
    }
    return [];
  });

  constructor() {
    this.detectMobileView();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.detectMobileView();
  }

  private detectMobileView() {
    const isMobile = window.innerWidth < 768;
    this.isMobileView.set(isMobile);

    if (isMobile) {
      this.isSidebarOpen.set(false);
    }
  }

  toggleSidebar() {
    if (!this.isMobileView()) {
      this.isSidebarOpen.update((value) => !value);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((value) => !value);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  logout() {
    console.log('Logout clicked');
    // Pour les tests, on peut changer de rôle au logout
    // this.currentUserRole.set(this.currentUserRole() === 'manager' ? 'employee' : 'manager');
  }
}
