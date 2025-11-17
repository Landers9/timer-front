// src/app/models/team.model.ts
import { User } from './user.model';

/**
 * Interface Team pour l'affichage
 */
export interface Team {
  id: string;
  name: string;
  description: string;
  manager: string; // UUID du manager
}

/**
 * Interface pour un membre d'équipe complet
 */
export interface TeamMember extends User {
  // Hérite de toutes les propriétés de User
}
