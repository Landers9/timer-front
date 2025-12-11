import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TeamService } from './team.service';
import { environment } from '../../environments/environment';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/teams`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllTeams', () => {
    it('should GET /teams/ and return teams from results', () => {
      const mockResponse = {
        count: 2,
        next: false,
        previous: false,
        results: [
          {
            id: 'team-1',
            name: 'Équipe Dev',
            description: 'Dev team',
            manager: 'mgr-1',
          },
          {
            id: 'team-2',
            name: 'Équipe QA',
            description: 'QA team',
            manager: 'mgr-1',
          },
        ],
        code: 200,
      };

      service.getAllTeams().subscribe((teams) => {
        expect(teams.length).toBe(2);
        expect(teams[0].id).toBe('team-1');
        expect(teams[0].name).toBe('Équipe Dev');
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTeamById', () => {
    it('should GET /teams/{id}/', () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Équipe Dev',
        description: 'Dev team',
        manager: 'mgr-1',
      };

      service.getTeamById('team-1').subscribe((team) => {
        expect(team.id).toBe('team-1');
        expect(team.name).toBe('Équipe Dev');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTeam);
    });
  });

  describe('createTeam', () => {
    it('should POST /teams/', () => {
      const payload = {
        name: 'New Team',
        description: 'Desc',
        manager: 'mgr-1',
      };
      const mockResponse = {
        id: 'new-team',
        name: 'New Team',
        description: 'Desc',
        manager: 'mgr-1',
      };

      service.createTeam(payload).subscribe((team) => {
        expect(team.id).toBe('new-team');
        expect(team.name).toBe('New Team');
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateTeam', () => {
    it('should PUT /teams/{id}/', () => {
      const payload = { name: 'Updated', description: 'New desc' };
      const mockResponse = {
        id: 'team-1',
        name: 'Updated',
        description: 'New desc',
        manager: 'mgr-1',
      };

      service.updateTeam('team-1', payload).subscribe((team) => {
        expect(team.name).toBe('Updated');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('deleteTeam', () => {
    it('should DELETE /teams/{id}/', () => {
      service.deleteTeam('team-1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/team-1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getTeamEmployees', () => {
    it('should GET /teams/{id}/employees/', () => {
      const mockResponse = {
        count: 2,
        next: false,
        previous: false,
        results: [
          {
            id: 'emp-1',
            first_name: 'Alice',
            last_name: 'Dupont',
            email: 'alice@test.com',
          },
          {
            id: 'emp-2',
            first_name: 'Bob',
            last_name: 'Martin',
            email: 'bob@test.com',
          },
        ],
        code: 200,
      };

      service.getTeamEmployees('team-1').subscribe((employees) => {
        expect(employees.length).toBe(2);
        expect(employees[0].first_name).toBe('Alice');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/employees/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTeamMembers', () => {
    it('should GET /teams/{id}/members/', () => {
      const mockResponse = {
        team: 'team-1',
        manager: { id: 'mgr-1', first_name: 'Jean', last_name: 'Manager' },
        members: ['emp-1', 'emp-2'],
        total_members: 2,
      };

      service.getTeamMembers('team-1').subscribe((response) => {
        expect(response.team).toBe('team-1');
        expect(response.total_members).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/members/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('addMemberToTeam', () => {
    it('should POST /teams/{id}/add-member/', () => {
      const payload = { user_id: 'new-member' };
      const mockResponse = {
        message: 'Membre ajouté',
        team: {
          id: 'team-1',
          name: 'Team',
          description: 'Desc',
          manager: 'mgr-1',
        },
      };

      service.addMemberToTeam('team-1', payload).subscribe((response) => {
        expect(response.message).toBe('Membre ajouté');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/add-member/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('removeMemberFromTeam', () => {
    it('should POST /teams/{id}/remove-member/', () => {
      const payload = { user_id: 'member-to-remove' };
      const mockResponse = {
        message: 'Membre retiré',
        team: {
          id: 'team-1',
          name: 'Team',
          description: 'Desc',
          manager: 'mgr-1',
        },
      };

      service.removeMemberFromTeam('team-1', payload).subscribe((response) => {
        expect(response.message).toBe('Membre retiré');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/remove-member/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });
});
