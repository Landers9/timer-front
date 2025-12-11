import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TeamsComponent } from './teams.component';
import { TeamService, ApiTeam } from '../../services/team.service';
import { UserService, ApiUser } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

describe('TeamsComponent', () => {
  let component: TeamsComponent;
  let fixture: ComponentFixture<TeamsComponent>;
  let consoleSpy: jest.SpyInstance;
  let teamServiceMock: {
    getAllTeams: jest.Mock;
    createTeam: jest.Mock;
    updateTeam: jest.Mock;
    deleteTeam: jest.Mock;
    getTeamEmployees: jest.Mock;
    addMemberToTeam: jest.Mock;
    removeMemberFromTeam: jest.Mock;
  };
  let userServiceMock: {
    getManagerEmployees: jest.Mock;
  };
  let authServiceMock: {
    currentUser: jest.Mock;
  };

  const mockApiTeams: ApiTeam[] = [
    {
      id: 'team-1',
      name: 'Équipe Dev',
      description: 'Développement',
      manager: 'mgr-1',
    },
    {
      id: 'team-2',
      name: 'Équipe Design',
      description: 'Design UX/UI',
      manager: 'mgr-1',
    },
  ];

  const createMockApiUser = (overrides: Partial<ApiUser> = {}): ApiUser => ({
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '+33612345678',
    role: 'EMPLOYEE',
    is_active: true,
    is_verified: true,
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
    device_id: null,
    fingerprint_id: null,
    position: 'Developer',
    department: 'IT',
    hire_date: '2023-01-15',
    created_by: 'mgr-1',
    ...overrides,
  });

  const mockEmployees: ApiUser[] = [
    createMockApiUser({
      id: 'emp-1',
      first_name: 'Alice',
      last_name: 'Martin',
    }),
    createMockApiUser({ id: 'emp-2', first_name: 'Bob', last_name: 'Dupont' }),
  ];

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    teamServiceMock = {
      getAllTeams: jest.fn().mockReturnValue(of(mockApiTeams)),
      createTeam: jest.fn(),
      updateTeam: jest.fn(),
      deleteTeam: jest.fn(),
      getTeamEmployees: jest.fn().mockReturnValue(of([])),
      addMemberToTeam: jest.fn(),
      removeMemberFromTeam: jest.fn(),
    };

    userServiceMock = {
      getManagerEmployees: jest.fn().mockReturnValue(of(mockEmployees)),
    };

    authServiceMock = {
      currentUser: jest.fn().mockReturnValue({ id: 'mgr-1', role: 'MANAGER' }),
    };

    await TestBed.configureTestingModule({
      imports: [TeamsComponent],
      providers: [
        { provide: TeamService, useValue: teamServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TeamsComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TeamsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - Load data', () => {
    it('should load teams on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(teamServiceMock.getAllTeams).toHaveBeenCalled();
      expect(component.teams().length).toBe(2);
      expect(component.isLoading()).toBe(false);
    }));

    it('should load manager employees on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(userServiceMock.getManagerEmployees).toHaveBeenCalled();
      expect(component.managerEmployees().length).toBe(2);
    }));

    it('should set current user id from auth service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.currentUserId()).toBe('mgr-1');
    }));

    it('should handle error when loading teams fails', fakeAsync(() => {
      teamServiceMock.getAllTeams.mockReturnValue(
        throwError(() => new Error('Erreur de chargement'))
      );

      fixture.detectChanges();
      tick();

      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('filteredTeams', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all teams when no filter', () => {
      expect(component.filteredTeams().length).toBe(2);
    });

    it('should filter teams by name', () => {
      component.searchQuery.set('Dev');
      expect(component.filteredTeams().length).toBe(1);
      expect(component.filteredTeams()[0].name).toBe('Équipe Dev');
    });

    it('should filter teams by description', () => {
      component.searchQuery.set('UX');
      expect(component.filteredTeams().length).toBe(1);
      expect(component.filteredTeams()[0].name).toBe('Équipe Design');
    });

    it('should be case insensitive', () => {
      component.searchQuery.set('design');
      expect(component.filteredTeams().length).toBe(1);
    });
  });

  describe('Modals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open/close create modal', () => {
      component.openCreateModal();
      expect(component.showCreateModal()).toBe(true);
      expect(component.formData().name).toBe('');

      component.closeModals();
      expect(component.showCreateModal()).toBe(false);
    });

    it('should open edit modal with team data', () => {
      const team = component.teams()[0];
      component.openEditModal(team);

      expect(component.showEditModal()).toBe(true);
      expect(component.selectedTeam()).toEqual(team);
      expect(component.formData().name).toBe(team.name);
      expect(component.formData().description).toBe(team.description);
    });

    it('should open delete modal', () => {
      const team = component.teams()[0];
      component.openDeleteModal(team);

      expect(component.showDeleteModal()).toBe(true);
      expect(component.selectedTeam()).toEqual(team);
    });

    it('should open details modal and load members', fakeAsync(() => {
      const team = component.teams()[0];
      teamServiceMock.getTeamEmployees.mockReturnValue(of(mockEmployees));

      component.openDetailsModal(team);
      tick();

      expect(component.showDetailsModal()).toBe(true);
      expect(component.selectedTeam()).toEqual(team);
      expect(teamServiceMock.getTeamEmployees).toHaveBeenCalledWith(team.id);
    }));

    it('should open add member modal', () => {
      component.openAddMemberModal();
      expect(component.showAddMemberModal()).toBe(true);
    });

    it('should open remove member modal', () => {
      const member = {
        id: 'emp-1',
        first_name: 'Alice',
        last_name: 'Martin',
      } as any;
      component.openRemoveMemberModal(member);

      expect(component.showRemoveMemberModal()).toBe(true);
      expect(component.memberToRemove()).toEqual(member);
    });

    it('should close all modals', () => {
      component.showCreateModal.set(true);
      component.showEditModal.set(true);
      component.showDeleteModal.set(true);
      component.showDetailsModal.set(true);
      component.showAddMemberModal.set(true);
      component.showRemoveMemberModal.set(true);

      component.closeModals();

      expect(component.showCreateModal()).toBe(false);
      expect(component.showEditModal()).toBe(false);
      expect(component.showDeleteModal()).toBe(false);
      expect(component.showDetailsModal()).toBe(false);
      expect(component.showAddMemberModal()).toBe(false);
      expect(component.showRemoveMemberModal()).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    describe('createTeam', () => {
      it('should create team successfully', fakeAsync(() => {
        const newTeam: ApiTeam = {
          id: 'team-3',
          name: 'New Team',
          description: 'Desc',
          manager: 'mgr-1',
        };
        teamServiceMock.createTeam.mockReturnValue(of(newTeam));

        component.openCreateModal();
        component.formData.set({ name: 'New Team', description: 'Desc' });
        component.createTeam();
        tick();

        expect(teamServiceMock.createTeam).toHaveBeenCalled();
        expect(component.teams().length).toBe(3);
        expect(component.showCreateModal()).toBe(false);
      }));

      it('should not create if no manager id', fakeAsync(() => {
        component.currentUserId.set(null);
        component.createTeam();
        tick();

        expect(teamServiceMock.createTeam).not.toHaveBeenCalled();
      }));

      it('should handle create error', fakeAsync(() => {
        teamServiceMock.createTeam.mockReturnValue(
          throwError(() => new Error('Erreur création'))
        );

        component.openCreateModal();
        component.formData.set({ name: 'New', description: 'Desc' });
        component.createTeam();
        tick();

        expect(component.isModalLoading()).toBe(false);
      }));
    });

    describe('updateTeam', () => {
      it('should update team successfully', fakeAsync(() => {
        const team = component.teams()[0];
        const updatedTeam: ApiTeam = { ...team, name: 'Updated Name' };
        teamServiceMock.updateTeam.mockReturnValue(of(updatedTeam));

        component.openEditModal(team);
        component.formData.set({
          name: 'Updated Name',
          description: team.description,
        });
        component.updateTeam();
        tick();

        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(
          team.id,
          expect.any(Object)
        );
        expect(component.teams()[0].name).toBe('Updated Name');
        expect(component.showEditModal()).toBe(false);
      }));

      it('should not update if no team selected', fakeAsync(() => {
        component.selectedTeam.set(null);
        component.updateTeam();
        tick();

        expect(teamServiceMock.updateTeam).not.toHaveBeenCalled();
      }));

      it('should handle update error', fakeAsync(() => {
        const team = component.teams()[0];
        teamServiceMock.updateTeam.mockReturnValue(
          throwError(() => new Error('Erreur update'))
        );

        component.openEditModal(team);
        component.updateTeam();
        tick();

        expect(component.isModalLoading()).toBe(false);
      }));
    });

    describe('deleteTeam', () => {
      it('should delete team successfully', fakeAsync(() => {
        const team = component.teams()[0];
        teamServiceMock.deleteTeam.mockReturnValue(of({}));

        component.openDeleteModal(team);
        component.deleteTeam();
        tick();

        expect(teamServiceMock.deleteTeam).toHaveBeenCalledWith(team.id);
        expect(component.teams().length).toBe(1);
        expect(component.teams().find((t) => t.id === team.id)).toBeUndefined();
      }));

      it('should not delete if no team selected', fakeAsync(() => {
        component.selectedTeam.set(null);
        component.deleteTeam();
        tick();

        expect(teamServiceMock.deleteTeam).not.toHaveBeenCalled();
      }));

      it('should handle delete error', fakeAsync(() => {
        const team = component.teams()[0];
        teamServiceMock.deleteTeam.mockReturnValue(
          throwError(() => new Error('Erreur delete'))
        );

        component.openDeleteModal(team);
        component.deleteTeam();
        tick();

        expect(component.isModalLoading()).toBe(false);
        expect(component.teams().length).toBe(2);
      }));
    });
  });

  describe('Member Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    describe('addMemberToTeam', () => {
      it('should add member successfully', fakeAsync(() => {
        const team = component.teams()[0];
        teamServiceMock.addMemberToTeam.mockReturnValue(of({ message: 'OK' }));
        teamServiceMock.getTeamEmployees.mockReturnValue(of(mockEmployees));

        component.selectedTeam.set(team);
        component.selectedUserId.set('emp-1');
        component.addMemberToTeam();
        tick();

        expect(teamServiceMock.addMemberToTeam).toHaveBeenCalledWith(team.id, {
          user_id: 'emp-1',
        });
        expect(component.showAddMemberModal()).toBe(false);
      }));

      it('should not add if no user or team selected', fakeAsync(() => {
        component.selectedTeam.set(null);
        component.selectedUserId.set(null);
        component.addMemberToTeam();
        tick();

        expect(teamServiceMock.addMemberToTeam).not.toHaveBeenCalled();
      }));

      it('should handle add member error', fakeAsync(() => {
        const team = component.teams()[0];
        teamServiceMock.addMemberToTeam.mockReturnValue(
          throwError(() => new Error('Erreur ajout'))
        );

        component.selectedTeam.set(team);
        component.selectedUserId.set('emp-1');
        component.addMemberToTeam();
        tick();

        expect(component.isModalLoading()).toBe(false);
      }));
    });

    describe('removeMemberFromTeam', () => {
      it('should remove member successfully', fakeAsync(() => {
        const team = component.teams()[0];
        const member = {
          id: 'emp-1',
          first_name: 'Alice',
          last_name: 'Martin',
        } as any;
        teamServiceMock.removeMemberFromTeam.mockReturnValue(
          of({ message: 'OK' })
        );
        teamServiceMock.getTeamEmployees.mockReturnValue(of([]));

        component.selectedTeam.set(team);
        component.memberToRemove.set(member);
        component.removeMemberFromTeam();
        tick();

        expect(teamServiceMock.removeMemberFromTeam).toHaveBeenCalledWith(
          team.id,
          { user_id: 'emp-1' }
        );
        expect(component.showRemoveMemberModal()).toBe(false);
      }));

      it('should not remove if no member or team', fakeAsync(() => {
        component.selectedTeam.set(null);
        component.memberToRemove.set(null);
        component.removeMemberFromTeam();
        tick();

        expect(teamServiceMock.removeMemberFromTeam).not.toHaveBeenCalled();
      }));
    });
  });

  describe('Helper methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('getUserFullName should return full name', () => {
      const user = { first_name: 'John', last_name: 'Doe' } as any;
      expect(component.getUserFullName(user)).toBe('John Doe');
    });

    it('getMemberCount should return count from map', () => {
      component.teamMemberCounts.set(new Map([['team-1', 5]]));
      const team = { id: 'team-1', name: 'Test', description: '', manager: '' };

      expect(component.getMemberCount(team)).toBe(5);
    });

    it('getMemberCount should return 0 for unknown team', () => {
      const team = {
        id: 'unknown',
        name: 'Test',
        description: '',
        manager: '',
      };
      expect(component.getMemberCount(team)).toBe(0);
    });
  });

  describe('availableUsers computed', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all employees when no team selected', () => {
      component.selectedTeam.set(null);
      expect(component.availableUsers().length).toBe(2);
    });

    it('should filter out existing team members', () => {
      const team = component.teams()[0];
      component.selectedTeam.set(team);
      component.teamMembers.set([
        { id: 'emp-1', first_name: 'Alice', last_name: 'Martin' } as any,
      ]);

      expect(component.availableUsers().length).toBe(1);
      expect(component.availableUsers()[0].id).toBe('emp-2');
    });
  });
});
