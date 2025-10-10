// src/app/pages/users/users.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Clock,
} from 'lucide-angular';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'employee' | 'manager';
}

interface ClockRecord {
  id: number;
  date: Date;
  clockIn: string;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalHours: number | null;
  status: 'completed' | 'in-progress';
  evaluation: 'on-time' | 'late' | 'early-leave' | 'perfect';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  // Icons
  readonly UserPlusIcon = UserPlus;
  readonly SearchIcon = Search;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly EyeIcon = Eye;
  readonly XIcon = X;
  readonly ClockIcon = Clock;

  // Data
  users = signal<User[]>([
    {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phoneNumber: '+33612345678',
      role: 'employee',
    },
    {
      id: 2,
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phoneNumber: '+33612345679',
      role: 'manager',
    },
    {
      id: 3,
      firstName: 'Pierre',
      lastName: 'Bernard',
      email: 'pierre.bernard@example.com',
      phoneNumber: '+33612345680',
      role: 'employee',
    },
    {
      id: 4,
      firstName: 'Sophie',
      lastName: 'Dubois',
      email: 'sophie.dubois@example.com',
      phoneNumber: '+33612345681',
      role: 'employee',
    },
    {
      id: 5,
      firstName: 'Luc',
      lastName: 'Moreau',
      email: 'luc.moreau@example.com',
      phoneNumber: '+33612345682',
      role: 'manager',
    },
  ]);

  clockRecords = signal<ClockRecord[]>([
    {
      id: 1,
      date: new Date('2025-10-08'),
      clockIn: '08:30',
      clockOut: '17:30',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: 8,
      status: 'completed',
      evaluation: 'perfect',
    },
    {
      id: 2,
      date: new Date('2025-10-09'),
      clockIn: '09:15',
      clockOut: '17:15',
      breakStart: '12:30',
      breakEnd: '13:30',
      totalHours: 7,
      status: 'completed',
      evaluation: 'late',
    },
    {
      id: 3,
      date: new Date('2025-10-10'),
      clockIn: '08:30',
      clockOut: null,
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: null,
      status: 'in-progress',
      evaluation: 'on-time',
    },
    {
      id: 4,
      date: new Date('2025-10-07'),
      clockIn: '08:00',
      clockOut: '16:45',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: 7.75,
      status: 'completed',
      evaluation: 'early-leave',
    },
    {
      id: 5,
      date: new Date('2025-10-06'),
      clockIn: '08:30',
      clockOut: '17:30',
      breakStart: '12:15',
      breakEnd: '13:00',
      totalHours: 8,
      status: 'completed',
      evaluation: 'perfect',
    },
  ]);

  // Search & filters
  searchQuery = signal('');
  roleFilter = signal<'all' | 'employee' | 'manager'>('all');

  // Modals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showDetailsModal = signal(false);

  // Form data
  formData = signal<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'employee',
  });

  selectedUser = signal<User | null>(null);

  // Filtered users
  filteredUsers = computed(() => {
    let filtered = this.users();

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Filter by role
    const role = this.roleFilter();
    if (role !== 'all') {
      filtered = filtered.filter((user) => user.role === role);
    }

    return filtered;
  });

  ngOnInit(): void {
    // Load users from API
  }

  // CRUD Operations
  openCreateModal(): void {
    this.formData.set({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'employee',
    });
    this.showCreateModal.set(true);
  }

  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.formData.set({ ...user });
    this.showEditModal.set(true);
  }

  openDeleteModal(user: User): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  openDetailsModal(user: User): void {
    this.selectedUser.set(user);
    this.showDetailsModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.showDetailsModal.set(false);
    this.selectedUser.set(null);
  }

  createUser(): void {
    const newUser: User = {
      id: Math.max(...this.users().map((u) => u.id)) + 1,
      firstName: this.formData().firstName!,
      lastName: this.formData().lastName!,
      email: this.formData().email!,
      phoneNumber: this.formData().phoneNumber!,
      role: this.formData().role!,
    };

    this.users.update((users) => [...users, newUser]);
    this.closeModals();
  }

  updateUser(): void {
    const userId = this.selectedUser()?.id;
    if (!userId) return;

    this.users.update((users) =>
      users.map((user) =>
        user.id === userId ? ({ ...user, ...this.formData() } as User) : user
      )
    );
    this.closeModals();
  }

  deleteUser(): void {
    const userId = this.selectedUser()?.id;
    if (!userId) return;

    this.users.update((users) => users.filter((user) => user.id !== userId));
    this.closeModals();
  }

  // Helpers
  getUserFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleBadgeClass(role: string): string {
    return role === 'manager' ? 'badge-primary' : 'badge-secondary';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'completed' ? 'badge-success' : 'badge-warning';
  }

  getEvaluationBadgeClass(evaluation: string): string {
    switch (evaluation) {
      case 'perfect':
        return 'badge-success';
      case 'on-time':
        return 'badge-info';
      case 'late':
        return 'badge-warning';
      case 'early-leave':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }

  getEvaluationLabel(evaluation: string): string {
    switch (evaluation) {
      case 'perfect':
        return 'Parfait';
      case 'on-time':
        return "À l'heure";
      case 'late':
        return 'Retard';
      case 'early-leave':
        return 'Départ anticipé';
      default:
        return 'N/A';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}
