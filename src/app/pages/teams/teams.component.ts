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
  managerEmployees = signal<User[]>([]); // Employés créés par le manager (disponibles pour ajout)
  teamMembers = signal<TeamMember[]>([]); // Membres actuels de l'équipe sélectionnée
  teamMemberCounts = signal<Map<string, number>>(new Map()); // Compte de membres par équipe

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
  showRemoveMemberModal = signal(false); // Nouveau modal de confirmation

  // Form data
  formData = signal<{
    name?: string;
    description?: string;
  }>({
    name: '',
    description: '',
  });

  selectedTeam = signal<Team | null>(null);
  selectedUserId = signal<string | null>(null);
  memberToRemove = signal<TeamMember | null>(null); // Membre à retirer

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

  // Available users (employees not in current team)
  availableUsers = computed(() => {
    const team = this.selectedTeam();
    if (!team) return this.managerEmployees();

    // Filtrer les employés qui ne sont pas déjà membres
    const currentMemberIds = this.teamMembers().map((m) => m.id);
    return this.managerEmployees().filter(
      (user) => !currentMemberIds.includes(user.id)
    );
  });

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadTeams();
    this.loadManagerEmployees(); // Charger les employés du manager
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
        }));
        this.teams.set(teams);

        // Charger le nombre de membres pour chaque équipe
        teams.forEach((team) => this.loadTeamMemberCount(team.id));

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
        this.isLoading.set(false);
      },
    });
  }

  loadManagerEmployees(): void {
    this.userService.getManagerEmployees().subscribe({
      next: (apiUsers: ApiUser[]) => {
        const employees: User[] = apiUsers.map((apiUser) => ({
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
        this.managerEmployees.set(employees);
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des employés du manager:',
          error
        );
      },
    });
  }

  loadTeamMemberCount(teamId: string): void {
    this.teamService.getTeamEmployees(teamId).subscribe({
      next: (apiUsers: ApiUser[]) => {
        // Mettre à jour le compte de membres pour cette équipe
        this.teamMemberCounts.update((counts) => {
          const newCounts = new Map(counts);
          newCounts.set(teamId, apiUsers.length);
          return newCounts;
        });
      },
      error: (error) => {
        console.error(
          `Erreur lors du chargement du compte de membres pour l'équipe ${teamId}:`,
          error
        );
      },
    });
  }

  loadTeamMembers(teamId: string): void {
    this.isModalLoading.set(true);
    this.teamService.getTeamEmployees(teamId).subscribe({
      next: (apiUsers: ApiUser[]) => {
        console.log('Team employees:', apiUsers);

        // Mapper les utilisateurs vers TeamMember
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

        // Mettre à jour aussi le compte
        this.teamMemberCounts.update((counts) => {
          const newCounts = new Map(counts);
          newCounts.set(teamId, members.length);
          return newCounts;
        });

        this.isModalLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres:', error);
        this.teamMembers.set([]);
        this.isModalLoading.set(false);
      },
    });
  }

  // ========== MODAL ACTIONS ==========

  openCreateModal(): void {
    this.formData.set({
      name: '',
      description: '',
    });
    this.showCreateModal.set(true);
  }

  openEditModal(team: Team): void {
    this.selectedTeam.set(team);
    this.formData.set({
      name: team.name,
      description: team.description,
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
    this.showRemoveMemberModal.set(false);
    this.selectedTeam.set(null);
    this.selectedUserId.set(null);
    this.memberToRemove.set(null);
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

  openRemoveMemberModal(member: TeamMember): void {
    this.memberToRemove.set(member);
    this.showRemoveMemberModal.set(true);
  }

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

  removeMemberFromTeam(): void {
    const member = this.memberToRemove();
    const team = this.selectedTeam();

    if (!member || !team) return;

    this.isModalLoading.set(true);

    this.teamService
      .removeMemberFromTeam(team.id, { user_id: member.id })
      .subscribe({
        next: (response) => {
          // Recharger les membres de l'équipe
          this.loadTeamMembers(team.id);
          this.showRemoveMemberModal.set(false);
          this.memberToRemove.set(null);
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
    return this.teamMemberCounts().get(team.id) ?? 0;
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
