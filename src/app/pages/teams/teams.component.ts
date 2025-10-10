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

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'employee' | 'manager';
}

interface Team {
  id: number;
  name: string;
  description: string;
  memberIds: number[];
}

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
  teams = signal<Team[]>([
    {
      id: 1,
      name: 'Équipe Développement',
      description: 'Équipe de développement logiciel',
      memberIds: [1, 3, 4],
    },
    {
      id: 2,
      name: 'Équipe Marketing',
      description: 'Équipe marketing et communication',
      memberIds: [2],
    },
    {
      id: 3,
      name: 'Équipe Ventes',
      description: 'Équipe commerciale',
      memberIds: [],
    },
    {
      id: 4,
      name: 'Équipe Support',
      description: 'Support client et technique',
      memberIds: [5],
    },
  ]);

  allUsers = signal<User[]>([
    {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      role: 'employee',
    },
    {
      id: 2,
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      role: 'manager',
    },
    {
      id: 3,
      firstName: 'Pierre',
      lastName: 'Bernard',
      email: 'pierre.bernard@example.com',
      role: 'employee',
    },
    {
      id: 4,
      firstName: 'Sophie',
      lastName: 'Dubois',
      email: 'sophie.dubois@example.com',
      role: 'employee',
    },
    {
      id: 5,
      firstName: 'Luc',
      lastName: 'Moreau',
      email: 'luc.moreau@example.com',
      role: 'manager',
    },
  ]);

  // Search
  searchQuery = signal('');

  // Modals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showDetailsModal = signal(false);
  showAddMemberModal = signal(false);

  // Form data
  formData = signal<Partial<Team>>({
    name: '',
    description: '',
    memberIds: [],
  });

  selectedTeam = signal<Team | null>(null);
  selectedUserId = signal<number | null>(null);

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

  // Team members
  teamMembers = computed(() => {
    const team = this.selectedTeam();
    if (!team) return [];

    return this.allUsers().filter((user) => team.memberIds.includes(user.id));
  });

  // Available users (not in team)
  availableUsers = computed(() => {
    const team = this.selectedTeam();
    if (!team) return this.allUsers();

    return this.allUsers().filter((user) => !team.memberIds.includes(user.id));
  });

  ngOnInit(): void {
    // Load teams from API
  }

  // CRUD Operations
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
    this.formData.set({ ...team });
    this.showEditModal.set(true);
  }

  openDeleteModal(team: Team): void {
    this.selectedTeam.set(team);
    this.showDeleteModal.set(true);
  }

  openDetailsModal(team: Team): void {
    this.selectedTeam.set(team);
    this.showDetailsModal.set(true);
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
  }

  createTeam(): void {
    const newTeam: Team = {
      id: Math.max(...this.teams().map((t) => t.id)) + 1,
      name: this.formData().name!,
      description: this.formData().description!,
      memberIds: this.formData().memberIds!,
    };

    this.teams.update((teams) => [...teams, newTeam]);
    this.closeModals();
  }

  updateTeam(): void {
    const teamId = this.selectedTeam()?.id;
    if (!teamId) return;

    this.teams.update((teams) =>
      teams.map((team) =>
        team.id === teamId ? ({ ...team, ...this.formData() } as Team) : team
      )
    );
    this.closeModals();
  }

  deleteTeam(): void {
    const teamId = this.selectedTeam()?.id;
    if (!teamId) return;

    this.teams.update((teams) => teams.filter((team) => team.id !== teamId));
    this.closeModals();
  }

  // Member Management
  addMemberToTeam(): void {
    const userId = this.selectedUserId();
    const teamId = this.selectedTeam()?.id;

    if (!userId || !teamId) return;

    this.teams.update((teams) =>
      teams.map((team) =>
        team.id === teamId
          ? { ...team, memberIds: [...team.memberIds, userId] }
          : team
      )
    );

    // Update selected team
    const updatedTeam = this.teams().find((t) => t.id === teamId);
    if (updatedTeam) {
      this.selectedTeam.set(updatedTeam);
    }

    this.showAddMemberModal.set(false);
    this.selectedUserId.set(null);
  }

  removeMemberFromTeam(userId: number): void {
    const teamId = this.selectedTeam()?.id;
    if (!teamId) return;

    this.teams.update((teams) =>
      teams.map((team) =>
        team.id === teamId
          ? { ...team, memberIds: team.memberIds.filter((id) => id !== userId) }
          : team
      )
    );

    // Update selected team
    const updatedTeam = this.teams().find((t) => t.id === teamId);
    if (updatedTeam) {
      this.selectedTeam.set(updatedTeam);
    }
  }

  // Helpers
  getMemberCount(team: Team): number {
    return team.memberIds.length;
  }

  getUserFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleBadgeClass(role: string): string {
    return role === 'manager' ? 'badge-primary' : 'badge-secondary';
  }
}
