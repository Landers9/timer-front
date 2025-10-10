// src/app/layouts/main-layout/main-layout.component.ts
import { Component, signal, computed } from '@angular/core';
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
  Power,
  Menu,
  Search,
  Bell,
  ClipboardMinus,
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  icon: any; // Changer string en any
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
  // Icônes disponibles dans le composant
  readonly MenuIcon = Menu;
  readonly SearchIcon = Search;
  readonly BellIcon = Bell;
  readonly PowerIcon = Power;

  isSidebarOpen = signal(true);
  searchQuery = signal('');
  notificationCount = signal(10);

  // Menu items avec icônes directes
  allMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
    { icon: Users, label: 'Teams', route: '/teams', roles: ['manager'] },
    { icon: UserCheck, label: 'Users', route: '/users', roles: ['manager'] },
    { icon: ClipboardMinus, label: 'Reports', route: '/reports', roles: ['manager'] },
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
