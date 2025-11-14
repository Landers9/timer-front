// src/app/pages/teams/teams.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  UserPlus,
  UserMinus,
} from 'lucide-angular';
import { Team, TeamMember } from '../../models/team.model';
import { User } from '../../models/user.model';
import { TeamService, ApiTeam } from '../../services/team.service';
import { UserService, ApiUser } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css',
})
export class TeamsComponent implements OnInit {
  // Icons
  readonly UsersIcon = Users;
  readonly SearchIcon = Search;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly EyeIcon = Eye;
  readonly XIcon = X;
  readonly UserPlusIcon = UserPlus;
  readonly UserMinusIcon = UserMinus;

  // Data
  teams = signal<Team[]>([]);
  allUsers = signal<User[]>([]);
  teamMembers = signal<TeamMember[]>([]);

  // Loading states
  isLoading = signal(false);
  isModalLoading = signal(false);

  // Search
  searchQuery = signal('');

  // Modals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showDetailsModal = signal(false);
  showAddMemberModal = signal(false);

  // Form data
  formData = signal<{
    name?: string;
    description?: string;
    memberIds?: string[];
  }>({
    name: '',
    description: '',
    memberIds: [],
  });

  selectedTeam = signal<Team | null>(null);
  selectedUserId = signal<string | null>(null);

  // Current user
  currentUserId = signal<string | null>(null);

  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  // Filtered teams
  filteredTeams = computed(() => {
    let filtered = this.teams();

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(query) ||
          team.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  // Available users (not in current team)
  availableUsers = computed(() => {
    const team = this.selectedTeam();
    if (!team) return this.allUsers();

    return this.allUsers().filter((user) => !team.memberIds.includes(user.id));
  });

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadTeams();
    this.loadAllUsers();
  }

  // ========== DATA LOADING ==========

  loadCurrentUser(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId.set(user.id);
    }
  }

  loadTeams(): void {
    this.isLoading.set(true);
    this.teamService.getAllTeams().subscribe({
      next: (apiTeams: ApiTeam[]) => {
        const teams: Team[] = apiTeams.map((apiTeam) => ({
          id: apiTeam.id,
          name: apiTeam.name,
          description: apiTeam.description,
          manager: apiTeam.manager,
          memberIds: [], // Sera rempli si nécessaire
        }));
        this.teams.set(teams);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
        this.isLoading.set(false);
      },
    });
  }

  loadAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (apiUsers: ApiUser[]) => {
        const users: User[] = apiUsers.map((apiUser) => ({
          id: apiUser.id,
          email: apiUser.email,
          first_name: apiUser.first_name,
          last_name: apiUser.last_name,
          phone_number: apiUser.phone_number,
          role: apiUser.role,
          is_active: apiUser.is_active,
          is_verified: apiUser.is_verified,
          created_at: apiUser.created_at,
          updated_at: apiUser.updated_at,
          device_id: apiUser.device_id,
          fingerprint_id: apiUser.fingerprint_id,
          position: apiUser.position,
          department: apiUser.department,
          hire_date: apiUser.hire_date,
          created_by: apiUser.created_by,
        }));
        this.allUsers.set(users);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      },
    });
  }

  loadTeamMembers(teamId: string): void {
    this.isModalLoading.set(true);
    this.teamService.getTeamEmployees(teamId).subscribe({
      next: (apiUsers: ApiUser[]) => {
        const members: TeamMember[] = apiUsers.map((apiUser) => ({
          id: apiUser.id,
          email: apiUser.email,
          first_name: apiUser.first_name,
          last_name: apiUser.last_name,
          phone_number: apiUser.phone_number,
          role: apiUser.role,
          is_active: apiUser.is_active,
          is_verified: apiUser.is_verified,
          created_at: apiUser.created_at,
          updated_at: apiUser.updated_at,
          device_id: apiUser.device_id,
          fingerprint_id: apiUser.fingerprint_id,
          position: apiUser.position,
          department: apiUser.department,
          hire_date: apiUser.hire_date,
          created_by: apiUser.created_by,
        }));
        this.teamMembers.set(members);

        // Update the team's memberIds
        const team = this.selectedTeam();
        if (team) {
          team.memberIds = members.map((m) => m.id);
          this.selectedTeam.set({ ...team });
        }

        this.isModalLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres:', error);
        this.isModalLoading.set(false);
      },
    });
  }

  // ========== MODAL ACTIONS ==========

  openCreateModal(): void {
    this.formData.set({
      name: '',
      description: '',
      memberIds: [],
    });
    this.showCreateModal.set(true);
  }

  openEditModal(team: Team): void {
    this.selectedTeam.set(team);
    this.formData.set({
      name: team.name,
      description: team.description,
      memberIds: team.memberIds,
    });
    this.showEditModal.set(true);
  }

  openDeleteModal(team: Team): void {
    this.selectedTeam.set(team);
    this.showDeleteModal.set(true);
  }

  openDetailsModal(team: Team): void {
    this.selectedTeam.set(team);
    this.teamMembers.set([]);
    this.showDetailsModal.set(true);
    this.loadTeamMembers(team.id);
  }

  openAddMemberModal(): void {
    this.selectedUserId.set(null);
    this.showAddMemberModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.showDetailsModal.set(false);
    this.showAddMemberModal.set(false);
    this.selectedTeam.set(null);
    this.selectedUserId.set(null);
    this.teamMembers.set([]);
  }

  // ========== CRUD OPERATIONS ==========

  createTeam(): void {
    this.isModalLoading.set(true);
    const managerId = this.currentUserId();

    if (!managerId) {
      console.error('Manager ID non disponible');
      this.isModalLoading.set(false);
      return;
    }

    const teamData = {
      name: this.formData().name!,
      description: this.formData().description!,
      manager: managerId,
    };

    this.teamService.createTeam(teamData).subscribe({
      next: (apiTeam: ApiTeam) => {
        const newTeam: Team = {
          id: apiTeam.id,
          name: apiTeam.name,
          description: apiTeam.description,
          manager: apiTeam.manager,
          memberIds: [],
        };
        this.teams.update((teams) => [...teams, newTeam]);
        this.isModalLoading.set(false);
        this.closeModals();
      },
      error: (error) => {
        console.error("Erreur lors de la création de l'équipe:", error);
        this.isModalLoading.set(false);
      },
    });
  }

  updateTeam(): void {
    const team = this.selectedTeam();
    if (!team) return;

    this.isModalLoading.set(true);

    const teamData = {
      name: this.formData().name,
      description: this.formData().description,
    };

    this.teamService.updateTeam(team.id, teamData).subscribe({
      next: (apiTeam: ApiTeam) => {
        this.teams.update((teams) =>
          teams.map((t) =>
            t.id === team.id
              ? {
                  ...t,
                  name: apiTeam.name,
                  description: apiTeam.description,
                }
              : t
          )
        );
        this.isModalLoading.set(false);
        this.closeModals();
      },
      error: (error) => {
        console.error("Erreur lors de la mise à jour de l'équipe:", error);
        this.isModalLoading.set(false);
      },
    });
  }

  deleteTeam(): void {
    const team = this.selectedTeam();
    if (!team) return;

    this.isModalLoading.set(true);

    this.teamService.deleteTeam(team.id).subscribe({
      next: () => {
        this.teams.update((teams) => teams.filter((t) => t.id !== team.id));
        this.isModalLoading.set(false);
        this.closeModals();
      },
      error: (error) => {
        console.error("Erreur lors de la suppression de l'équipe:", error);
        this.isModalLoading.set(false);
      },
    });
  }

  // ========== MEMBER MANAGEMENT ==========

  addMemberToTeam(): void {
    const userId = this.selectedUserId();
    const team = this.selectedTeam();

    if (!userId || !team) return;

    this.isModalLoading.set(true);

    this.teamService.addMemberToTeam(team.id, { user_id: userId }).subscribe({
      next: (response) => {
        // Recharger les membres de l'équipe
        this.loadTeamMembers(team.id);
        this.showAddMemberModal.set(false);
        this.selectedUserId.set(null);
        this.isModalLoading.set(false);
      },
      error: (error) => {
        console.error("Erreur lors de l'ajout du membre:", error);
        this.isModalLoading.set(false);
      },
    });
  }

  removeMemberFromTeam(userId: string): void {
    const team = this.selectedTeam();
    if (!team) return;

    this.isModalLoading.set(true);

    this.teamService
      .removeMemberFromTeam(team.id, { user_id: userId })
      .subscribe({
        next: (response) => {
          // Recharger les membres de l'équipe
          this.loadTeamMembers(team.id);
          this.isModalLoading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du retrait du membre:', error);
          this.isModalLoading.set(false);
        },
      });
  }

  // ========== HELPERS ==========

  getMemberCount(team: Team): number {
    return team.memberIds.length;
  }

  getUserFullName(user: User | TeamMember): string {
    return `${user.first_name} ${user.last_name}`;
  }

  getRoleBadgeClass(role: string): string {
    return role === 'MANAGER' || role === 'ADMIN'
      ? 'badge-primary'
      : 'badge-secondary';
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Employé';
      default:
        return role;
    }
  }
}
