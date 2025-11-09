// src/app/layouts/main-layout/main-layout.component.ts
import {
  Component,
  signal,
  computed,
  HostListener,
  OnInit,
} from '@angular/core';
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
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User as UserModel } from '../../models/user.model';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: ('EMPLOYEE' | 'MANAGER' | 'ADMIN')[];
}

interface DisplayUser {
  firstName: string;
  lastName: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
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
export class MainLayoutComponent implements OnInit {
  isSidebarOpen = signal(true);
  searchQuery = signal('');
  notificationCount = signal(10);
  isMobileView = signal(false);
  isMobileMenuOpen = signal(false);

  // Utilisateur récupéré dynamiquement de l'API
  currentUser = signal<DisplayUser | null>(null);
  isLoadingUser = signal(true);

  // Menu items pour desktop sidebar (tous les rôles)
  allMenuItems: MenuItem[] = [
    { icon: 'layout-dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'clock', label: 'Clock', route: '/clock' },
    {
      icon: 'users',
      label: 'Teams',
      route: '/teams',
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      icon: 'user-check',
      label: 'Users',
      route: '/users',
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      icon: 'clipboard-list',
      label: 'Reports',
      route: '/reports',
      roles: ['MANAGER', 'ADMIN'],
    },
    { icon: 'user', label: 'Profile', route: '/profile' },
  ];

  // Menu items pour desktop sidebar (filtré par rôle)
  menuItems = computed(() => {
    const user = this.currentUser();
    return this.allMenuItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role || 'EMPLOYEE');
    });
  });

  // Menu items pour mobile sidebar manager (Dashboard, Teams, Users, Reports)
  managerSidebarMenuItems = computed(() => {
    const user = this.currentUser();
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      return [
        this.allMenuItems[0], // Dashboard
        this.allMenuItems[2], // Teams
        this.allMenuItems[3], // Users
        this.allMenuItems[4], // Reports
      ];
    }
    return [];
  });

  // Computed pour vérifier si l'utilisateur est manager
  isManager = computed(() => {
    const user = this.currentUser();
    return user?.role === 'MANAGER' || user?.role === 'ADMIN';
  });

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.detectMobileView();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /**
   * Charger les informations de l'utilisateur connecté depuis l'API
   */
  private loadCurrentUser(): void {
    this.isLoadingUser.set(true);
    this.userService.getCurrentUser().subscribe({
      next: (response: UserModel) => {
        this.currentUser.set({
          firstName: response.first_name,
          lastName: response.last_name,
          role: response.role,
        });
        this.isLoadingUser.set(false);
      },
      error: (error) => {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
        this.isLoadingUser.set(false);
        // En cas d'erreur, on garde l'utilisateur du AuthService si disponible
        const authUser = this.authService.currentUser();
        if (authUser) {
          this.currentUser.set({
            firstName: authUser.first_name || 'User',
            lastName: authUser.last_name || '',
            role: authUser.role || 'EMPLOYEE',
          });
        }
      },
    });
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
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Même si l'API échoue, on déconnecte localement
        this.router.navigate(['/login']);
      },
    });
  }
}
