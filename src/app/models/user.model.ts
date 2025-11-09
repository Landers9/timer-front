// src/app/models/user.model.ts

/**
 * Interface User basée sur la réponse API
 * Correspond exactement à la structure retournée par /users/me/
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  device_id: string | null;
  fingerprint_id: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  created_by: string | null;
}

/**
 * Interface pour l'affichage dans les composants
 * Utilise une structure plus pratique avec des noms en camelCase
 */
export interface UserDisplay {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deviceId: string | null;
  fingerprintId: string | null;
  position: string;
  department: string;
  hireDate: Date | null;
  createdBy: string | null;
}

/**
 * Utilitaire pour convertir User API vers UserDisplay
 */
export function mapUserToDisplay(user: User): UserDisplay {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phoneNumber: user.phone_number || '',
    role: user.role,
    isActive: user.is_active,
    isVerified: user.is_verified,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
    deviceId: user.device_id,
    fingerprintId: user.fingerprint_id,
    position: user.position || '',
    department: user.department || '',
    hireDate: user.hire_date ? new Date(user.hire_date) : null,
    createdBy: user.created_by,
  };
}
