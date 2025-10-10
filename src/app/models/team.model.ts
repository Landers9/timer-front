// src/app/models/team.model.ts
import { User } from './user.model';

export interface Team {
  id: number;
  name: string;
  description: string;
  managerId: number;
  manager?: User;
  members: User[];
}
