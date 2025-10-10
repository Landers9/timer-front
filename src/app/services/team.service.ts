// src/app/services/team.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from '../models/team.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private apiUrl = `${environment.apiUrl}/teams`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  getById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }

  create(team: Partial<Team>): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, team);
  }

  update(id: number, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${this.apiUrl}/${id}`, team);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
