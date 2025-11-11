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
import {
  UserService,
  ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../services/user.service';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  position: string;
  department: string;
  hireDate: string | null;
  isActive: boolean;
  isVerified: boolean;
}

interface FormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  position?: string;
  department?: string;
  hireDate?: string;
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
  users = signal<User[]>([]);
  isLoadingList = signal(false); // Loading pour la liste
  isLoadingModal = signal(false); // Loading pour les actions dans les modals
  errorMessage = signal<string | null>(null);
  currentUserRole = signal<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE');

  // UI State
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showDetailsModal = signal(false);
  selectedUser = signal<User | null>(null);

  // Filters
  searchQuery = signal('');
  roleFilter = signal<'all' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('all');

  // Form Data
  formData = signal<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'EMPLOYEE',
    position: '',
    department: '',
    hireDate: '',
  });

  // Computed
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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadCurrentUserRole();
    this.loadUsers();
  }

  /**
   * Charger le rôle de l'utilisateur connecté
   */
  loadCurrentUserRole(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserRole.set(user.role);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du rôle:', error);
        // Par défaut, on met EMPLOYEE pour restreindre les permissions
        this.currentUserRole.set('EMPLOYEE');
      },
    });
  }

  /**
   * Obtenir les rôles autorisés selon le rôle de l'utilisateur connecté
   */
  getAvailableRoles(): {
    value: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    label: string;
  }[] {
    const currentRole = this.currentUserRole();

    if (currentRole === 'ADMIN') {
      // Admin peut créer tous les rôles
      return [
        { value: 'EMPLOYEE', label: 'Employé' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'ADMIN', label: 'Administrateur' },
      ];
    } else if (currentRole === 'MANAGER') {
      // Manager ne peut créer que des employés
      return [{ value: 'EMPLOYEE', label: 'Employé' }];
    } else {
      // Employee ne devrait pas pouvoir créer d'utilisateurs
      return [];
    }
  }

  /**
   * Charger tous les utilisateurs depuis l'API
   */
  loadUsers(): void {
    this.isLoadingList.set(true);
    this.errorMessage.set(null);

    this.userService.getAllUsers().subscribe({
      next: (apiUsers) => {
        const users: User[] = apiUsers.map(this.mapApiUserToUser);
        this.users.set(users);
        this.isLoadingList.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.errorMessage.set(
          error.message || 'Erreur lors du chargement des utilisateurs'
        );
        this.isLoadingList.set(false);
      },
    });
  }

  /**
   * Mapper un ApiUser vers User pour l'affichage
   */
  private mapApiUserToUser(apiUser: ApiUser): User {
    return {
      id: apiUser.id,
      firstName: apiUser.first_name,
      lastName: apiUser.last_name,
      email: apiUser.email,
      phoneNumber: apiUser.phone_number || '',
      role: apiUser.role,
      position: apiUser.position || '',
      department: apiUser.department || '',
      hireDate: apiUser.hire_date,
      isActive: apiUser.is_active,
      isVerified: apiUser.is_verified,
    };
  }

  /**
   * Mapper FormData vers CreateUserRequest
   */
  private mapFormDataToCreateRequest(formData: FormData): CreateUserRequest {
    return {
      email: formData.email!,
      first_name: formData.firstName!,
      last_name: formData.lastName!,
      phone_number: formData.phoneNumber || undefined,
      role: formData.role!,
      is_active: true,
      is_verified: false,
      position: formData.position || undefined,
      department: formData.department || undefined,
      hire_date: formData.hireDate || undefined,
    };
  }

  /**
   * Mapper FormData vers UpdateUserRequest
   */
  private mapFormDataToUpdateRequest(formData: FormData): UpdateUserRequest {
    return {
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phoneNumber,
      role: formData.role,
      position: formData.position,
      department: formData.department,
      hire_date: formData.hireDate,
    };
  }

  // CRUD Operations
  openCreateModal(): void {
    this.formData.set({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'EMPLOYEE',
      position: '',
      department: '',
      hireDate: '',
    });
    this.showCreateModal.set(true);
  }

  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.formData.set({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      position: user.position,
      department: user.department,
      hireDate: user.hireDate || '',
    });
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
    this.errorMessage.set(null);
  }

  createUser(): void {
    this.isLoadingModal.set(true);
    this.errorMessage.set(null);

    const createRequest = this.mapFormDataToCreateRequest(this.formData());

    this.userService.createUser(createRequest).subscribe({
      next: (apiUser) => {
        const newUser = this.mapApiUserToUser(apiUser);
        this.users.update((users) => [...users, newUser]);
        this.closeModals();
        this.isLoadingModal.set(false);
      },
      error: (error) => {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        this.errorMessage.set(
          error.message || "Erreur lors de la création de l'utilisateur"
        );
        this.isLoadingModal.set(false);
      },
    });
  }

  updateUser(): void {
    const userId = this.selectedUser()?.id;
    if (!userId) return;

    this.isLoadingModal.set(true);
    this.errorMessage.set(null);

    const updateRequest = this.mapFormDataToUpdateRequest(this.formData());

    this.userService.updateUser(userId, updateRequest).subscribe({
      next: (apiUser) => {
        const updatedUser = this.mapApiUserToUser(apiUser);
        this.users.update((users) =>
          users.map((user) => (user.id === userId ? updatedUser : user))
        );
        this.closeModals();
        this.isLoadingModal.set(false);
      },
      error: (error) => {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        this.errorMessage.set(
          error.message || "Erreur lors de la mise à jour de l'utilisateur"
        );
        this.isLoadingModal.set(false);
      },
    });
  }

  deleteUser(): void {
    const userId = this.selectedUser()?.id;
    if (!userId) return;

    this.isLoadingModal.set(true);
    this.errorMessage.set(null);

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.users.update((users) =>
          users.filter((user) => user.id !== userId)
        );
        this.closeModals();
        this.isLoadingModal.set(false);
      },
      error: (error) => {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        this.errorMessage.set(
          error.message || "Erreur lors de la suppression de l'utilisateur"
        );
        this.isLoadingModal.set(false);
      },
    });
  }

  // Helpers
  getUserFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'badge-primary';
      case 'MANAGER':
        return 'badge-info';
      case 'EMPLOYEE':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Employé';
      default:
        return role;
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
