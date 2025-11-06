// src/app/models/user.model.ts

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string; // UUID
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string; // ISO date
  updated_at: string; // ISO date
  device_id: string | null;
  fingerprint_id: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null; // ISO date
  created_by: string | null; // UUID
}

// Pour la compatibilité avec l'ancien code qui utilise firstName/lastName
export interface UserLegacy {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'employee' | 'manager';
}

// Helper pour convertir User API vers UserLegacy (si nécessaire temporairement)
export function toLegacyUser(user: User): UserLegacy {
  return {
    id: parseInt(user.id.substring(0, 8), 16), // Fake numeric ID from UUID
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phoneNumber: user.phone_number || '',
    role: user.role === 'EMPLOYEE' ? 'employee' : 'manager',
  };
}
