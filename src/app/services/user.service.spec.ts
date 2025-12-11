import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentUser', () => {
    it('should GET /users/me/', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'EMPLOYEE',
      };

      service.getCurrentUser().subscribe((user) => {
        expect(user.email).toBe('test@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/me/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should GET /users/ and return results', () => {
      const mockResponse = {
        count: 2,
        next: false,
        previous: false,
        results: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            first_name: 'Alice',
            last_name: 'Dupont',
          },
          {
            id: 'user-2',
            email: 'user2@test.com',
            first_name: 'Bob',
            last_name: 'Martin',
          },
        ],
        code: 200,
      };

      service.getAllUsers().subscribe((users) => {
        expect(users.length).toBe(2);
        expect(users[0].email).toBe('user1@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getManagerEmployees', () => {
    it('should GET /users/employees/', () => {
      const mockResponse = {
        count: 1,
        next: false,
        previous: false,
        results: [
          {
            id: 'emp-1',
            email: 'emp@test.com',
            first_name: 'Employee',
            last_name: 'One',
          },
        ],
        code: 200,
      };

      service.getManagerEmployees().subscribe((employees) => {
        expect(employees.length).toBe(1);
        expect(employees[0].first_name).toBe('Employee');
      });

      const req = httpMock.expectOne(`${apiUrl}/employees/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUserById', () => {
    it('should GET /users/{id}/', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      service.getUserById('user-1').subscribe((user) => {
        expect(user.id).toBe('user-1');
      });

      const req = httpMock.expectOne(`${apiUrl}/user-1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('createUser', () => {
    it('should POST /users/', () => {
      const payload = {
        email: 'new@test.com',
        first_name: 'New',
        last_name: 'User',
        role: 'EMPLOYEE' as const,
        is_active: true,
        is_verified: false,
      };
      const mockResponse = { id: 'new-user', ...payload };

      service.createUser(payload).subscribe((user) => {
        expect(user.id).toBe('new-user');
        expect(user.email).toBe('new@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateUser', () => {
    it('should PATCH /users/{id}/', () => {
      const payload = { first_name: 'Updated', last_name: 'Name' };
      const mockResponse = { id: 'user-1', email: 'test@test.com', ...payload };

      service.updateUser('user-1', payload).subscribe((user) => {
        expect(user.first_name).toBe('Updated');
      });

      const req = httpMock.expectOne(`${apiUrl}/user-1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateUserProfile', () => {
    it('should PUT /users/{id}/', () => {
      const payload = {
        email: 'updated@test.com',
        first_name: 'Updated',
        last_name: 'Profile',
      };
      const mockResponse = { id: 'user-1', ...payload };

      service.updateUserProfile('user-1', payload).subscribe((user) => {
        expect(user.email).toBe('updated@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/user-1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('should DELETE /users/{id}/', () => {
      service.deleteUser('user-1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/user-1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('changePassword', () => {
    it('should PUT /users/change-password/{id}/', () => {
      const payload = { old_password: 'oldpass', new_password: 'newpass' };
      const mockResponse = { detail: 'Password changed successfully' };

      service.changePassword('user-1', payload).subscribe((response) => {
        expect(response.detail).toBe('Password changed successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/change-password/user-1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });
});
