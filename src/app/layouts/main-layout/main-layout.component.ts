// src/app/layouts/main-layout/main-layout.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  User,
  Users,
  UserCheck,
  Menu,
  Bell,
  ClipboardMinus,
  LogOut,
  Clock,
  FileText,
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  icon: any;
  label: string;
  route: string;
  roles?: ('employee' | 'manager')[];
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
  // Icons
  readonly MenuIcon = Menu;
  readonly BellIcon = Bell;
  readonly LogOutIcon = LogOut;
  readonly DashboardIcon = LayoutDashboard;
  readonly ReportsIcon = FileText;
  readonly UsersTabIcon = Users;
  readonly ClockTabIcon = Clock;
  readonly TeamsTabIcon = UserCheck;
  readonly ProfileTabIcon = User;

  isSidebarOpen = signal(true);
  isMobileSidebarOpen = signal(false);
  notificationCount = signal(10);

  allMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
    { icon: Users, label: 'Teams', route: '/teams', roles: ['manager'] },
    { icon: UserCheck, label: 'Users', route: '/users', roles: ['manager'] },
    {
      icon: ClipboardMinus,
      label: 'Reports',
      route: '/reports',
      roles: ['manager'],
    },
    { icon: User, label: 'Profile', route: '/profile' },
  ];

  menuItems = computed(() => {
    const user = this.authService.currentUser();
    return this.allMenuItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role || 'manager');
    });
  });

  constructor(public authService: AuthService, private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen.update((value) => !value);
  }

  openMobileSidebar() {
    this.isMobileSidebarOpen.set(true);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  logout() {
    this.authService.logout();
    this.closeMobileSidebar();
    this.router.navigate(['/login']);
  }
}
